'use strict';

const Homey = require('homey');
const moment = require('../../lib/moment-timezone-with-data');
const pricesLib = require('../../lib/prices');
const nordpool = require('../../lib/nordpool');
const Formula = require('fparser');

module.exports = class UtilityCostsDevice extends Homey.Device {

  async onInit() {
    await this.migrate();

    this._lastFetchData = undefined;
    this._lastPrice = undefined;
    this._prices = undefined;

    this.scheduleCheckTime(5);
    this.log(this.getName() + ' -> device initialized');
  }

  async migrate() {
    try {
      if (!this.hasCapability('meter_sum_current')) {
        await this.addCapability('meter_sum_current');
      }
      if (!this.hasCapability('meter_sum_month')) {
        await this.addCapability('meter_sum_month');
      }
      if (!this.hasCapability('meter_gridprice_incl')) {
        await this.addCapability('meter_gridprice_incl');
      }
      if (!this.hasCapability('meter_cost_year')) {
        await this.addCapability('meter_cost_year');
        await this.setCapabilityValue('meter_cost_year', this.getCapabilityValue('meter_cost_month') || 0);
      }
      if (!this.hasCapability('meter_grid_year')) {
        await this.addCapability('meter_grid_year');
        await this.setCapabilityValue('meter_grid_year', this.getCapabilityValue('meter_grid_month') || 0);
      }
      if (!this.hasCapability('meter_sum_day')) {
        await this.addCapability('meter_sum_day');
      }
      if (!this.hasCapability('meter_sum_year')) {
        await this.addCapability('meter_sum_year');
      }
      if (!this.hasCapability('meter_price_sum')) {
        await this.addCapability('meter_price_sum');
      }
      if (!this.hasCapability('meter_consumption')) {
        await this.addCapability('meter_consumption');
      }
      this.log(this.getName() + ' -> migrated OK');
    } catch (err) {
      this.error(err);
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('costFormula')) {
      this.validateCostFormula(newSettings.costFormula);
    }
    if (changedKeys.includes('priceArea')) {
      this._lastFetchData = undefined;
    }
    if (changedKeys.includes('priceDecimals')) {
      await this.updatePriceDecimals(newSettings.priceDecimals);
    }
    this._lastPrice = undefined;
    this.scheduleCheckTime(2);
  }

  validateCostFormula(costFormula) {
    try {
      const test = this.evaluatePrice(costFormula, costFormula.includes('PRICE_NORDPOOL') ? 1.23 : undefined);
      this.log(`Formula validated OK => ${costFormula}`);
    } catch (err) {
      if (err.message) {
        throw new Error(this.homey.__('errors.invalid_cost_formula_msg', { message: err.message }));
      } else {
        throw new Error(this.homey.__('errors.invalid_cost_formula'));
      }
    }
  }

  async updatePriceDecimals(priceDecimals) {
    try {
      const decimals = priceDecimals === 'DEC2' ? 2 : 5;

      const capOps1 = this.getCapabilityOptions('meter_price_incl');
      capOps1.decimals = decimals;
      await this.setCapabilityOptions('meter_price_incl', capOps1);

      const capOps2 = this.getCapabilityOptions('meter_gridprice_incl');
      capOps2.decimals = decimals;
      await this.setCapabilityOptions('meter_gridprice_incl', capOps2);

      const capOps3 = this.getCapabilityOptions('meter_price_excl');
      capOps3.decimals = decimals;
      await this.setCapabilityOptions('meter_price_excl', capOps3);

      const capOps4 = this.getCapabilityOptions('meter_price_sum');
      capOps4.decimals = decimals;
      await this.setCapabilityOptions('meter_price_sum', capOps4);
    } catch (err) {
      this.log('Updating number of decimals failed: ', err);
    }
  }

  onDeleted() {
    this._deleted = true;
    this.clearCheckTime();
    this.log(this.getName() + ' -> device deleted');
  }

  clearCheckTime() {
    if (this.curTimeout) {
      this.homey.clearTimeout(this.curTimeout);
      this.curTimeout = undefined;
    }
  }

  scheduleCheckTime(seconds = 60) {
    if (this._deleted) {
      return;
    }
    this.clearCheckTime();
    this.log(`Checking time in ${seconds} seconds`);
    this.curTimeout = this.homey.setTimeout(this.checkTime.bind(this), seconds * 1000);
  }

  async checkTime() {
    if (this._deleted) {
      return;
    }
    try {
      this.clearCheckTime();
      const settings = this.getSettings();
      if (settings.priceCalcMethod === 'nordpool_spot') {
        if (this.shallFetchData()) {
          await this.fetchData();
        }
        if (this._prices) {
          await this.onData();
        }
      } else if (settings.priceCalcMethod === 'fixed') {
        await this.fixedPriceCalculation();
      }
      await this.gridPriceCalculation();
      await this.onUpdateConsumption();
    } catch (err) {
      this.error(err);
    } finally {
      this.scheduleCheckTime();
    }
  }

  async fetchData() {
    try {
      const settings = this.getSettings();
      const priceArea = settings.priceArea || 'Bergen';
      this.log('Will fetch prices:', this.getData().id, priceArea);
      const localTime = moment().startOf('day');
      const prices = await nordpool.fetchPrices(localTime, { priceArea, currency: 'NOK' });
      if (prices) {
        this._lastFetchData = moment();
        this._prices = prices;
        this.log('Got prices:', this.getData().id, prices.length);
      }
    } catch (err) {
      this.error(err);
    }
  }

  shallFetchData() {
    return !this._prices
      || !this._lastFetchData
      || pricesLib.toHour(this._lastFetchData) !== pricesLib.toHour(moment());
  }

  async onData() {
    try {
      const localTime = moment();

      const currentPrice = pricesLib.currentPrice(this._prices, localTime);
      const startAtHour = currentPrice ? pricesLib.toHour(currentPrice.startsAt) : undefined;
      if (currentPrice) {
        this.log('Current price:', startAtHour, currentPrice.price);
        const priceChanged = !this._lastPrice || startAtHour !== pricesLib.toHour(this._lastPrice.startsAt);
        if (priceChanged) {
          this._lastPrice = currentPrice;
          await this.spotPriceCalculation(currentPrice.price);
        }
      }
    } catch (err) {
      this.error(err);
    }
  }

  async spotPriceCalculation(price) {
    const costFormula = this.getSetting('costFormula');
    try {
      const priceCalculated = this.roundPrice(this.evaluatePrice(costFormula, price));
      await this.setCapabilityValue('meter_price_excl', price);
      await this.setCapabilityValue('meter_price_incl', priceCalculated);
      const gridPrice = this.getCapabilityValue(`meter_gridprice_incl`) || 0;
      await this.setCapabilityValue('meter_price_sum', priceCalculated + gridPrice);
      this.log(`Spot price calculation: ${costFormula} => ${priceCalculated}`);
    } catch (err) {
      this.error(`Spot price formula failed: "${costFormula}"`, err);
    }
  }

  async fixedPriceCalculation() {
    const costFormula = this.getSetting('costFormula');
    try {
      const price = this.roundPrice(this.evaluatePrice(costFormula));
      await this.setCapabilityValue('meter_price_excl', this.roundPrice(price / 1.25));
      await this.setCapabilityValue('meter_price_incl', price);
      const gridPrice = this.getCapabilityValue(`meter_gridprice_incl`) || 0;
      await this.setCapabilityValue('meter_price_sum', price + gridPrice);
      this.log(`Fixed price calculation: ${costFormula} => ${price}`);
    } catch (err) {
      this.error(`Fixed price formula failed: "${costFormula}"`, err);
    }
  }

  async gridPriceCalculation() {
    const costFormula = this.getSetting('costFormula');
    try {
      const settings = this.getSettings();
      if (settings.gridNewRegime) {
        const momentNow = moment();

        const dayStart = moment().startOf('day').add(6, 'hour');
        const dayEnd = moment().startOf('day').add(22, 'hour');
        const daytime = momentNow.isSameOrAfter(dayStart) && momentNow.isBefore(dayEnd);
        const isWeekend = momentNow.day() === 0 || momentNow.day() === 6;
        const lowPrice = !daytime || settings.gridEnergyLowWeekends && isWeekend;

        const winterStart = parseInt(settings.gridEnergyWinterStart);
        const summerStart = parseInt(settings.gridEnergySummerStart);
        const isSummerPeriod = winterStart < summerStart && momentNow.month() >= summerStart
          || winterStart > summerStart && momentNow.month() >= summerStart && momentNow.month() < winterStart;

        const price = isSummerPeriod ?
          (lowPrice ? settings.gridEnergyNightSummer : settings.gridEnergyDaySummer) :
          (lowPrice ? settings.gridEnergyNight : settings.gridEnergyDay);

        //this.log(`Get grid energy price (new regime): Weekend: ${isWeekend}, Low Price: ${lowPrice}, winterStart: ${winterStart}, summerStart: ${summerStart}, isSummerPeriod: ${isSummerPeriod}, price: ${price}`);
        const gridConsumptionPrice = this.roundPrice(price);
        await this.setCapabilityValue('meter_gridprice_incl', gridConsumptionPrice);
        const utilityPrice = this.getCapabilityValue(`meter_price_incl`) || 0;
        await this.setCapabilityValue('meter_price_sum', gridConsumptionPrice + utilityPrice);
      } else {
        const gridConsumptionPrice = settings.gridConsumption;
        //this.log(`Get grid energy price (old regime): price: ${gridConsumptionPrice}`);
        await this.setCapabilityValue('meter_gridprice_incl', gridConsumptionPrice);
        const utilityPrice = this.getCapabilityValue(`meter_price_incl`) || 0;
        await this.setCapabilityValue('meter_price_sum', gridConsumptionPrice + utilityPrice);
      }
    } catch (err) {
      this.error(`Grid price formula failed: "${costFormula}"`, err);
    }
  }

  async onUpdatePrice(price) {
    try {
      await this.setSettings({ 'priceCalcMethod': 'flow' });
      await this.setCapabilityValue('meter_price_excl', this.roundPrice(price / 1.25));
      await this.setCapabilityValue('meter_price_incl', price);
      const gridPrice = this.getCapabilityValue(`meter_gridprice_incl`) || 0;
      await this.setCapabilityValue('meter_price_sum', price + gridPrice);
      this.log(`Price updated: => ${price}`);
    } catch (err) {
      this.error('Price from flow update failed:', err);
    }
  }

  evaluatePrice(str, price) {
    const str2 = str.replace(/PRICE_NORDPOOL/g, `[PRICE_NORDPOOL]`);
    const parser = new Formula(str2);
    if (price) {
      return parser.evaluate({ PRICE_NORDPOOL: price });
    } else {
      return parser.evaluate();
    }
  }

  roundPrice(price) {
    return Math.round(100000 * price) / 100000;
  }

  async onUpdateConsumption(consumption) {
    const startOfValues = await this.startOfValues();
    if (consumption === undefined) {
      consumption = this.getCapabilityValue('meter_consumption');
    } else {
      await this.setCapabilityValue('meter_consumption', consumption);
    }
    if (consumption !== undefined && consumption !== null && startOfValues.lastUpdate) {
      await this.calculateUtilityCost(consumption, startOfValues);
      await this.calculateGridCost(consumption, startOfValues);
      await this.calculateSumCost(consumption);
    }
  }

  async startOfValues() {
    const thisUpdate = Date.now();
    const startOfHour = moment().startOf('hour').valueOf();
    const startOfDay = moment().startOf('day').valueOf();
    const startOfMonth = moment().startOf('month').valueOf();
    const startOfYear = moment().startOf('year').valueOf();

    const lastUpdate = this.getStoreValue('lastConsumptionUpdate');
    await this.setStoreValue('lastConsumptionUpdate', thisUpdate);

    const newHour = (lastUpdate < startOfHour) && (thisUpdate >= startOfHour);
    const newDay = (lastUpdate < startOfDay) && (thisUpdate >= startOfDay);
    const newMonth = (lastUpdate < startOfMonth) && (thisUpdate >= startOfMonth);
    const newYear = (lastUpdate < startOfYear) && (thisUpdate >= startOfYear);

    return {
      thisUpdate,
      lastUpdate,
      startOfHour,
      startOfDay,
      startOfMonth,
      startOfYear,
      newHour,
      newDay,
      newMonth,
      newYear
    };
  }

  async calculateUtilityCost(consumption, { thisUpdate, lastUpdate, startOfDay, newHour, newDay, newMonth, newYear }) {
    try {
      const price = this.getCapabilityValue(`meter_price_incl`) || 0;

      const sumConsumptionHour = this.getCapabilityValue(`meter_consumption_hour`) || 0;
      const consumptionWh = consumption * (thisUpdate - lastUpdate) / (3600000);
      const newConsumptionWh = newHour ? consumptionWh : consumptionWh + sumConsumptionHour;
      await this.setCapabilityValue(`meter_consumption_hour`, newConsumptionWh);

      const sumConsumptionMaxHour = this.getCapabilityValue(`meter_consumption_maxmonth`) || 0;
      const newConsumptionMaxMonthWh = newMonth ? consumptionWh : (newConsumptionWh > sumConsumptionMaxHour ? newConsumptionWh : undefined);
      if (newConsumptionMaxMonthWh) {
        await this.setCapabilityValue(`meter_consumption_maxmonth`, newConsumptionMaxMonthWh);
        if (!newMonth && (newConsumptionWh > sumConsumptionMaxHour)) {
          const prevLevel = this.getGridCapacityLevel(sumConsumptionMaxHour);
          const newLevel = this.getGridCapacityLevel(newConsumptionWh);
          if (newLevel > prevLevel) {
            await this.homey.flow.getDeviceTriggerCard('grid_capacity_level')
              .trigger(this, {
                meter_consumption_maxmonth: Math.round(newConsumptionMaxMonthWh),
                grid_capacity_level: newLevel
              }, {})
              .catch(err => this.error('Trigger grid_capacity_level failed: ', err));
          }
        }
      }

      const costToday = newDay ?
        consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price
        : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price;

      const costYesterday = newDay ?
        consumption * (startOfDay - lastUpdate) / (1000 * 3600000) * price
        : undefined;

      const sumCostToday = this.getCapabilityValue(`meter_cost_today`) || 0;
      const newCostToday = newDay ? costToday : costToday + sumCostToday;
      if (newCostToday !== undefined) {
        await this.setCapabilityValue(`meter_cost_today`, newCostToday);
      }

      const newCostYesterday = newDay ? sumCostToday + costYesterday : undefined;
      if (newCostYesterday !== undefined) {
        await this.setCapabilityValue(`meter_cost_yesterday`, newCostYesterday);
      }

      const sumCostMonth = this.getCapabilityValue(`meter_cost_month`) || 0;
      const newCostMonth = newMonth ? costToday : costToday + sumCostMonth;
      if (newCostMonth !== undefined) {
        await this.setCapabilityValue(`meter_cost_month`, newCostMonth);
      }

      const newCostLastMonth = newMonth ? sumCostMonth + costYesterday : undefined;
      if (newCostLastMonth !== undefined) {
        await this.setCapabilityValue(`meter_cost_lastmonth`, newCostLastMonth);
      }

      const sumCostYear = this.getCapabilityValue(`meter_cost_year`) || 0;
      const newCostYear = newYear ? costToday : costToday + sumCostYear;
      if (newCostYear !== undefined) {
        await this.setCapabilityValue(`meter_cost_year`, newCostYear);
      }

      //this.log(`Utility calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday},  (this month: ${sumCostMonth})`, this.getCapabilityValue(`meter_cost_today`));
    } catch (err) {
      this.error('calculateUtilityCost failed: ', err);
    }
  }

  async calculateGridCost(consumption, { thisUpdate, lastUpdate, startOfDay, newDay, newMonth, newYear }) {
    try {
      const price = this.getCapabilityValue(`meter_gridprice_incl`) || 0;

      const costToday = newDay ?
        (consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price
          + this.getGridFixedAmountPerDay()
          + this.getGridCapacityPerDay())
        : (consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price);

      const costYesterday = newDay ?
        consumption * (startOfDay - lastUpdate) / (1000 * 3600000) * price
        : undefined;

      const sumCostToday = this.getCapabilityValue(`meter_grid_today`) || 0;
      const newCostToday = newDay ? costToday : costToday + sumCostToday;
      if (newCostToday !== undefined) {
        await this.setCapabilityValue(`meter_grid_today`, newCostToday);
      }

      const newCostYesterday = newDay ? sumCostToday + costYesterday : undefined;
      if (newCostYesterday !== undefined) {
        await this.setCapabilityValue(`meter_grid_yesterday`, newCostYesterday);
      }

      const sumCostMonth = this.getCapabilityValue(`meter_grid_month`) || 0;
      const newCostMonth = newMonth ? costToday : costToday + sumCostMonth;
      if (newCostMonth !== undefined) {
        await this.setCapabilityValue(`meter_grid_month`, newCostMonth);
      }

      const newCostLastMonth = newMonth ? sumCostMonth + costYesterday : undefined;
      if (newCostLastMonth !== undefined) {
        await this.setCapabilityValue(`meter_grid_lastmonth`, newCostLastMonth);
      }

      const sumCostYear = this.getCapabilityValue(`meter_grid_year`) || 0;
      const newCostYear = newYear ? costToday : costToday + sumCostYear;
      if (newCostYear !== undefined) {
        await this.setCapabilityValue(`meter_grid_year`, newCostYear);
      }

      //this.log(`Grid calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday}`);
    } catch (err) {
      this.error('calculateGridCost failed: ', err);
    }
  }

  async calculateSumCost(consumption) {
    try {
      const utilityPrice = this.getCapabilityValue(`meter_price_incl`) || 0;
      const gridPrice = this.getCapabilityValue(`meter_gridprice_incl`) || 0;

      const sumCurrent = consumption / (1000) * (utilityPrice + gridPrice);
      await this.setCapabilityValue(`meter_sum_current`, sumCurrent);

      await this.setCapabilityValue(`meter_sum_day`, (this.getCapabilityValue(`meter_cost_today`) || 0) + (this.getCapabilityValue(`meter_grid_today`) || 0));
      await this.setCapabilityValue(`meter_sum_month`, (this.getCapabilityValue(`meter_cost_month`) || 0) + (this.getCapabilityValue(`meter_grid_month`) || 0));
      await this.setCapabilityValue(`meter_sum_year`, (this.getCapabilityValue(`meter_cost_year`) || 0) + (this.getCapabilityValue(`meter_grid_year`) || 0));

      //this.log(`Calculate sum cost: Utility: ${utilityMonth}, Grid: ${gridMonth} => ${sumMonth}`);
    } catch (err) {
      this.error('calculateSumCost failed: ', err);
    }
  }

  getGridFixedAmountPerDay() {
    try {
      const settings = this.getSettings();
      const yearStart = moment().startOf('year');
      const yearEnd = moment().startOf('year').add(1, 'year');
      const numDaysInYear = yearEnd.diff(yearStart, 'days');
      return settings.gridNewRegime ? 0 : settings.gridFixedAmount / numDaysInYear;
    } catch (err) {
      this.error('getGridFixedAmountPerDay failed: ', err);
    }
    return 0;
  }

  getGridCapacityPerDay() {
    try {
      const settings = this.getSettings();
      const monthStart = moment().startOf('month');
      const monthEnd = moment().startOf('month').add(1, 'month');
      const numDaysInMonth = monthEnd.diff(monthStart, 'days');
      return settings.gridNewRegime ? this.getGridCapacity() / numDaysInMonth : 0;
    } catch (err) {
      this.error('getGridCapacityPerDay failed: ', err);
    }
    return 0;
  }

  getGridCapacity() {
    const settings = this.getSettings();
    const sumConsumptionMaxHour = this.getCapabilityValue(`meter_consumption_maxmonth`) || 0;

    if (sumConsumptionMaxHour < 2000) {
      return settings.gridCapacity0_2;
    } else if (sumConsumptionMaxHour >= 2000 && sumConsumptionMaxHour < 5000) {
      return settings.gridCapacity2_5;
    } else if (sumConsumptionMaxHour >= 5000 && sumConsumptionMaxHour < 10000) {
      return settings.gridCapacity5_10;
    } else if (sumConsumptionMaxHour >= 10000 && sumConsumptionMaxHour < 15000) {
      return settings.gridCapacity10_15;
    } else if (sumConsumptionMaxHour >= 15000 && sumConsumptionMaxHour < 20000) {
      return settings.gridCapacity15_20;
    } else if (sumConsumptionMaxHour >= 20000) {
      return settings.gridCapacity20_25;
    }
  }

  getGridCapacityLevel(sumConsumptionMaxHour) {
    if (sumConsumptionMaxHour < 2000) {
      return 0;
    } else if (sumConsumptionMaxHour >= 2000 && sumConsumptionMaxHour < 5000) {
      return 1;
    } else if (sumConsumptionMaxHour >= 5000 && sumConsumptionMaxHour < 10000) {
      return 2;
    } else if (sumConsumptionMaxHour >= 10000 && sumConsumptionMaxHour < 15000) {
      return 3;
    } else if (sumConsumptionMaxHour >= 15000 && sumConsumptionMaxHour < 20000) {
      return 4;
    } else if (sumConsumptionMaxHour >= 20000) {
      return 5;
    }
  }

};
