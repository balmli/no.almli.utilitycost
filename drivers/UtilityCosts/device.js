'use strict';

const Homey = require('homey');
const moment = require('../../lib/moment-timezone-with-data');
const pricesLib = require('../../lib/prices');
const nordpool = require('../../lib/nordpool');

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
        this.addCapability('meter_sum_current');
      }
      if (!this.hasCapability('meter_sum_month')) {
        this.addCapability('meter_sum_month');
      }
      this.log(this.getName() + ' -> migrated OK');
    } catch (err) {
      this.error(err);
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this._lastFetchData = undefined;
    this._lastPrice = undefined;
    this.scheduleCheckTime(5);
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

  async checkTime(onoff, home_override) {
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
      this._lastFetchData = moment();
      this._prices = prices;
      this.log('Got prices:', this.getData().id, prices.length);
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
      const price = currentPrice ? currentPrice.price : undefined;

      if (currentPrice) {
        this.log('Current price:', startAtHour, price);
        const priceChanged = !this._lastPrice || startAtHour !== pricesLib.toHour(this._lastPrice.startsAt);
        if (priceChanged) {
          this._lastPrice = currentPrice;
          await this.setCapabilityValue('meter_price_excl', price).catch(this.error);

          try {
            const costFormula = this.getSetting('costFormula');
            const costFormula2 = costFormula.replace(/PRICE_NORDPOOL/g, `${price}`);
            const priceC = Math.round(100000 * this.parse(costFormula2)) / 100000;
            await this.setCapabilityValue('meter_price_incl', priceC).catch(this.error);
            this.log(`Spot price calculation: ${costFormula2} => ${priceC}`);
          } catch (err) {
            this.error('Price formula failed:', err);
          }

        }
      }
    } catch (err) {
      this.error(err);
    }
  }

  parse(str) {
    return Function(`'use strict'; return (${str})`)()
  }

  async fixedPriceCalculation() {
    try {
      const costFormula = this.getSetting('costFormula');
      const costFormula2 = costFormula.replace(/PRICE_NORDPOOL/g, ``);
      const price = Math.round(100000 * this.parse(costFormula2)) / 100000;
      await this.setCapabilityValue('meter_price_excl', Math.round(100000 * price / 1.25) / 100000);
      await this.setCapabilityValue('meter_price_incl', price);
      this.log(`Fixed price calculation: ${costFormula2} => ${price}`);
    } catch (err) {
      this.error('Price formula failed:', err);
    }
  }

  async onUpdatePrice(price) {
    try {
      await this.setSettings({ 'priceCalcMethod': 'flow' });
      await this.setCapabilityValue('meter_price_excl', Math.round(100000 * price / 1.25) / 100000);
      await this.setCapabilityValue('meter_price_incl', price);
      this.log(`Price updated: => ${price}`);
    } catch (err) {
      this.error('Price from flow update failed:', err);
    }
  }

  async onUpdateConsumption(consumption) {
    await this.calculateUtilityCost(consumption);
    await this.calculateGridCost(consumption);
    await this.calculateSumCost(consumption);
  }

  async calculateUtilityCost(consumption) {
    try {
      const thisUpdate = Date.now();
      const startOfHour = moment().startOf('hour').valueOf();
      const startOfDay = moment().startOf('day').valueOf();
      const startOfMonth = moment().startOf('month').valueOf();
      const lastUpdate = this.getStoreValue('lastConsumptionUpdate');
      await this.setStoreValue('lastConsumptionUpdate', thisUpdate);

      if (lastUpdate) {
        const price = this.getCapabilityValue(`meter_price_incl`) || 0;
        const newHour = (lastUpdate < startOfHour) && (thisUpdate >= startOfHour);
        const newDay = (lastUpdate < startOfDay) && (thisUpdate >= startOfDay);
        const newMonth = (lastUpdate < startOfMonth) && (thisUpdate >= startOfMonth);

        const sumConsumptionHour = this.getCapabilityValue(`meter_consumption_hour`) || 0;
        const consumptionWh = consumption * (thisUpdate - lastUpdate) / (3600000);
        const newConsumptionWh = newHour ? consumptionWh : consumptionWh + sumConsumptionHour;
        await this.setCapabilityValue(`meter_consumption_hour`, newConsumptionWh);

        const sumConsumptionMaxHour = this.getCapabilityValue(`meter_consumption_maxmonth`) || 0;
        const newConsumptionMaxMonthWh = newMonth ? consumptionWh : (newConsumptionWh > sumConsumptionMaxHour ? newConsumptionWh : undefined);
        if (newConsumptionMaxMonthWh) {
          await this.setCapabilityValue(`meter_consumption_maxmonth`, newConsumptionMaxMonthWh);
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

        //this.log(`Utility calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday},  (this month: ${sumCostMonth})`, this.getCapabilityValue(`meter_cost_today`));
      }
    } catch (err) {
      this.error('calculateUtilityCost failed: ', err);
    }
  }

  async calculateGridCost(consumption) {
    try {
      const thisUpdate = Date.now();
      const startOfDay = moment().startOf('day').valueOf();
      const startOfMonth = moment().startOf('month').valueOf();

      const lastUpdate = this.getStoreValue('lastGridUpdate');
      await this.setStoreValue('lastGridUpdate', thisUpdate);

      if (lastUpdate) {
        const settings = this.getSettings();

        const momentNow = moment();
        const gridDayStart = moment().startOf('day').add(6, 'hour');
        const gridDayEnd = moment().startOf('day').add(22, 'hour');
        const gridDay = momentNow.isSameOrAfter(gridDayStart) && momentNow.isBefore(gridDayEnd);
        const price = gridDay ? settings.gridEnergyDay : settings.gridEnergyNight;

        const newDay = (lastUpdate < startOfDay) && (thisUpdate >= startOfDay);
        const newMonth = (lastUpdate < startOfMonth) && (thisUpdate >= startOfMonth);

        const costToday = newDay ?
          consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price
          : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price;

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

        //this.log(`Grid calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday}`);
      }
    } catch (err) {
      this.error('calculateGridCost failed: ', err);
    }
  }

  async calculateSumCost(consumption) {
    try {
      const settings = this.getSettings();

      const momentNow = moment();
      const gridDayStart = moment().startOf('day').add(6, 'hour');
      const gridDayEnd = moment().startOf('day').add(22, 'hour');
      const gridDay = momentNow.isSameOrAfter(gridDayStart) && momentNow.isBefore(gridDayEnd);

      const utilityPrice = this.getCapabilityValue(`meter_price_incl`) || 0;
      const gridPrice = gridDay ? settings.gridEnergyDay : settings.gridEnergyNight;

      const sumCurrent = consumption / (1000) * (utilityPrice + gridPrice);
      await this.setCapabilityValue(`meter_sum_current`, sumCurrent);

      const utilityMonth = this.getCapabilityValue(`meter_cost_month`) || 0;
      const gridMonth = this.getCapabilityValue(`meter_grid_month`) || 0;
      const gridCapacityMonth = await this.getGridCapacity();
      const sumMonth = utilityMonth + gridMonth + gridCapacityMonth;
      await this.setCapabilityValue(`meter_sum_month`, sumMonth);

      //this.log(`Calculate sum cost: Utility: ${utilityMonth}, Grid: ${gridMonth}, Grid capacity: ${gridCapacityMonth} => ${sumMonth}`);
    } catch (err) {
      this.error('calculateGridCost failed: ', err);
    }
  }

  async getGridCapacity() {
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

};
