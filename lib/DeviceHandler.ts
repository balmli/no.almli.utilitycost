import moment from 'moment-timezone';

import { NordpoolPrices } from '@balmli/homey-utility-prices';
import {DEFAULT_DEVICE_HANDLER_OPTIONS, DeviceHandlerOptions, DeviceSettings, StartValues, StoreValues} from "./types";

const Formula = require('fparser');

const MAX_VALID_POWER = 100_000;

export class DeviceHandler {

    private device: any;
    private options: DeviceHandlerOptions;
    private settings!: DeviceSettings;
    private debug: boolean;
    private storeValues: StoreValues;

    constructor(homeyDevice: any, options?: DeviceHandlerOptions) {
        this.debug = false;
        this.device = homeyDevice;
        this.options = options ? options : DEFAULT_DEVICE_HANDLER_OPTIONS;
        this.storeValues = new StoreValues();
        this.restoreStoreValues();
        const settings = this.device.getSettings();
        const ds: DeviceSettings = {
            ...settings
        };
        this.setSettings(ds);
    }

    setDebug(debug: boolean) {
        this.debug = debug;
    }

    setOptions(options: DeviceHandlerOptions): void {
        this.options = options;
    }

    getSettings(): DeviceSettings {
        return this.settings;
    }

    setSettings(settings: DeviceSettings) {
        this.device.logger.debug('Set settings:', settings);
        this.settings = settings;
    }

    getStoreValues(): StoreValues {
        return this.storeValues;
    }

    restoreStoreValues(): void {
        const storeValues = this.device.getStoreValue('storeValues');
        if (storeValues !== undefined && storeValues !== null) {
            this.storeValues = storeValues;
        }
        this.device.logger.info(`Store values restored: ${JSON.stringify(this.storeValues)}`);
    }

    async storeStoreValues(): Promise<void> {
        try {
            await this.device.setStoreValue('storeValues', this.storeValues);
            this.device.logger.debug(`Store values stored: ${JSON.stringify(this.storeValues)}`);
        } catch (err) {
            this.device.logger.error(`Storing values failed:`, err);
        }
    }

    evaluatePrice(str: string, price?: number, aDate?: any) {
        const momentNow = aDate ? moment(aDate) : moment();
        const monthStart = momentNow.startOf('month');
        const monthEnd = moment(momentNow).startOf('month').add(1, 'month');
        const numHoursInMonth = monthEnd.diff(monthStart, 'days') * 24;

        const str2 = str.replace(/PRICE_NORDPOOL/g, `[PRICE_NORDPOOL]`);
        const str3 = str2.replace(/MONTHLY_HOURS/g, `${numHoursInMonth}`);
        const parser = new Formula(str3);
        if (price) {
            return parser.evaluate({PRICE_NORDPOOL: price});
        } else {
            return parser.evaluate();
        }
    }

    validateCostFormula(costFormula: string): boolean {
        try {
            const test = this.evaluatePrice(costFormula, costFormula.includes('PRICE_NORDPOOL') ? 1.23 : undefined);
            this.device.logger.info(`Formula validated OK => ${costFormula}`);
            return true;
        } catch (err: any) {
            if (err.message) {
                throw new Error(this.device.homey.__('errors.invalid_cost_formula_msg', {message: err.message}));
            } else {
                throw new Error(this.device.homey.__('errors.invalid_cost_formula'));
            }
        }
    }

    evaluateFixedAmount(str: string, aDate?: any) {
        const momentNow = aDate ? moment(aDate) : moment();
        const monthStart = momentNow.startOf('month');
        const monthEnd = moment(momentNow).startOf('month').add(1, 'month');
        const numHoursInMonth = monthEnd.diff(monthStart, 'days') * 24;

        const str3 = str.replace(/MONTHLY_HOURS/g, `${numHoursInMonth}`);
        const parser = new Formula(str3);
        return parser.evaluate();
    }

    validateCostFormulaFixedAmount(costFormulaFixedAmount: string): boolean {
        try {
            const test = this.evaluateFixedAmount(costFormulaFixedAmount);
            this.device.logger.info(`Formula validated OK => ${costFormulaFixedAmount}`);
            return true;
        } catch (err: any) {
            if (err.message) {
                throw new Error(this.device.homey.__('errors.invalid_cost_formula_fixed_amount_msg', {message: err.message}));
            } else {
                throw new Error(this.device.homey.__('errors.invalid_cost_formula_fixed_amount'));
            }
        }
    }

    roundPrice(price: number) {
        return Math.round(100000 * price) / 100000;
    }

    async spotPricesCalculation(prices: NordpoolPrices): Promise<void> {
        try {
            const dayStart = moment().startOf('day');
            const dayEnd = moment().startOf('day').add(1, 'day');

            const avg_daily_spot = this.roundPrice(
                prices
                    .filter(p => p.startsAt.isSameOrAfter(dayStart) && p.startsAt.isBefore(dayEnd))
                    .map(p => this.settings.dailyConsumptionExclTaxes === 'EXCL' ? p.price :
                        this.calcSpotPrice(p.price) + this.calcGridPrice(p.startsAt))
                    .reduce((a, b) => a + b, 0) / 24
            );

            await this.device.setCapabilityValue('meter_avg_daily_spot', avg_daily_spot);
        } catch (err) {
            this.device.logger.error(`Spot prices calculation failed: `, err);
        }
    }

    async spotPriceCalculation(price: number) {
        const costFormula = this.settings.costFormula;
        try {
            const priceCalculated = this.roundPrice(this.evaluatePrice(costFormula, price));
            await this.device.setCapabilityValue('meter_price_excl', price);
            await this.device.setCapabilityValue('meter_price_incl', priceCalculated);
            const gridPrice = this.device.getCapabilityValue(`meter_gridprice_incl`) || 0;
            await this.device.setCapabilityValue('meter_price_sum', priceCalculated + gridPrice);
            this.device.logger.verbose(`Spot price calculation: ${costFormula} => ${priceCalculated}`);
        } catch (err) {
            this.device.logger.error(`Spot price formula failed: "${costFormula}"`, err);
        }
    }

    calcSpotPrice(price: number): number {
        const costFormula = this.settings.costFormula;
        try {
            return this.roundPrice(this.evaluatePrice(costFormula, price));
        } catch (err) {
            this.device.logger.error(`Spot price formula failed: "${costFormula}"`, err);
        }
        return 0;
    }

    async fixedPriceCalculation() {
        const costFormula = this.settings.costFormula;
        try {
            const price = this.roundPrice(this.evaluatePrice(costFormula));
            await this.device.setCapabilityValue('meter_price_excl', this.roundPrice(price / 1.25));
            await this.device.setCapabilityValue('meter_price_incl', price);
            const gridPrice = this.device.getCapabilityValue(`meter_gridprice_incl`) || 0;
            await this.device.setCapabilityValue('meter_price_sum', price + gridPrice);
            this.device.logger.verbose(`Fixed price calculation: ${costFormula} => ${price}`);
        } catch (err) {
            this.device.logger.error(`Fixed price formula failed: "${costFormula}"`, err);
        }
    }

    async gridPriceCalculation(aDate: any) {
        try {
                const momentNow = moment(aDate);

                const dayStart = moment(aDate).startOf('day').add(6, 'hour');
                const dayEnd = moment(aDate).startOf('day').add(22, 'hour');
                const daytime = momentNow.isSameOrAfter(dayStart) && momentNow.isBefore(dayEnd);
                const isWeekend = momentNow.day() === 0 || momentNow.day() === 6;
                const lowPrice = !daytime || this.settings.gridEnergyLowWeekends && isWeekend;

                const price = (lowPrice ? this.settings.gridEnergyNight : this.settings.gridEnergyDay);

                this.device.logger.debug(`Get grid energy price (new regime): Weekend: ${isWeekend}, Low Price: ${lowPrice}, price: ${price}`);
                const gridConsumptionPrice = this.roundPrice(price);
                await this.device.setCapabilityValue('meter_gridprice_incl', gridConsumptionPrice);
                const utilityPrice = this.device.getCapabilityValue(`meter_price_incl`) || 0;
                await this.device.setCapabilityValue('meter_price_sum', gridConsumptionPrice + utilityPrice);
        } catch (err) {
            this.device.logger.error(`Grid price formula failed: `, err);
        }
    }

    calcGridPrice(aDate: any): number {
        try {
                const momentNow = moment(aDate);

                const dayStart = moment(aDate).startOf('day').add(6, 'hour');
                const dayEnd = moment(aDate).startOf('day').add(22, 'hour');
                const daytime = momentNow.isSameOrAfter(dayStart) && momentNow.isBefore(dayEnd);
                const isWeekend = momentNow.day() === 0 || momentNow.day() === 6;
                const lowPrice = !daytime || this.settings.gridEnergyLowWeekends && isWeekend;

                const price = (lowPrice ? this.settings.gridEnergyNight : this.settings.gridEnergyDay);
                return this.roundPrice(price);
        } catch (err) {
            this.device.logger.error(`Grid price formula failed: `, err);
        }
        return 0;
    }

    async updatePrice(price: number) {
        try {
            await this.device.setSettings({'priceCalcMethod': 'flow'});
            await this.device.setCapabilityValue('meter_price_excl', this.roundPrice(price / 1.25));
            await this.device.setCapabilityValue('meter_price_incl', price);
            const gridPrice = this.device.getCapabilityValue(`meter_gridprice_incl`) || 0;
            await this.device.setCapabilityValue('meter_price_sum', price + gridPrice);
            this.device.logger.verbose(`Price updated: => ${price}`);
        } catch (err) {
            this.device.logger.error('Price from flow update failed:', err);
        }
    }

    async startOfValues(aDate: any): Promise<StartValues> {
        const now = moment(aDate);
        const thisUpdate = now.valueOf();

        const startOfHour = moment(thisUpdate).startOf('hour').valueOf();
        const startOfDay = moment(thisUpdate).startOf('day').valueOf();
        const startOfMonth = moment(thisUpdate).startOf('month').valueOf();
        const startOfYear = moment(thisUpdate).startOf('year').valueOf();

        const lastUpdate = this.storeValues.lastConsumptionUpdate;
        this.storeValues.lastConsumptionUpdate = thisUpdate;

        const newHour = !!lastUpdate && (lastUpdate < startOfHour) && (thisUpdate >= startOfHour);
        const newDay = !!lastUpdate && (lastUpdate < startOfDay) && (thisUpdate >= startOfDay);
        const newMonth = !!lastUpdate && (lastUpdate < startOfMonth) && (thisUpdate >= startOfMonth);
        const newYear = !!lastUpdate && (lastUpdate < startOfYear) && (thisUpdate >= startOfYear);

        return {
            now,
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

    async updateConsumption(consumption: number | undefined, aDate: any) {
        if (!!consumption && consumption > MAX_VALID_POWER) {
            return;
        }
        const momentNow = moment(aDate);
        const startOfValues = await this.startOfValues(momentNow);
        if (consumption === undefined) {
            consumption = this.device.getCapabilityValue('meter_consumption');
        } else {
            await this.device.setCapabilityValue('meter_consumption', consumption);
        }
        if (consumption !== undefined && consumption !== null && startOfValues.lastUpdate) {
            await this.calculateEnergy(consumption, startOfValues);
            await this.calculateUtilityCost(consumption, startOfValues);
            await this.calculateGridCost(consumption, startOfValues);
            await this.calculateMaxConsumptionHour(consumption, startOfValues);
            await this.calculateSumCost(consumption);
        }
    }

    async updateEnergy(energy: number, aDate: any) {
        const momentNow = moment(aDate);
        const thisUpdate = momentNow.valueOf();

        const lastUpdate = this.storeValues.lastConsumptionUpdate;
        const lastEnergy = this.device.getCapabilityValue('meter_energy');
        await this.device.setCapabilityValue('meter_energy', energy);

        if (lastEnergy === undefined || lastEnergy === null || !lastUpdate) {
            this.storeValues.lastConsumptionUpdate = thisUpdate;
            return;
        }

        const consumption = (energy - lastEnergy) * 1000 * 3600000 / (thisUpdate - lastUpdate);
        await this.updateConsumption(consumption, aDate);
    }

    async calculateEnergy(consumption: number, startValues: StartValues): Promise<void> {
        const {thisUpdate, lastUpdate, startOfDay, startOfMonth, startOfYear, newDay, newMonth, newYear} = startValues;
        if (!lastUpdate) {
            return;
        }
        try {
            const energyAcc = this.device.getCapabilityValue(`meter_power.acc`) || 0;
            const newEnergyAcc = newDay && this.settings.resetEnergyDaily ?
                consumption * (thisUpdate - startOfDay) / (1000 * 3600000)
                : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) + energyAcc;
            await this.device.setCapabilityValue(`meter_power.acc`, newEnergyAcc);

            const energyMonthlyAcc = this.device.getCapabilityValue(`meter_power.month`) || 0;
            if (newMonth) {
                const energyYesterday = consumption * (startOfDay - lastUpdate) / (1000 * 3600000);
                await this.device.setCapabilityValue(`meter_power.prevmonth`, energyMonthlyAcc + energyYesterday);
            }
            const newEnergyMonthlyAcc = newMonth ?
                consumption * (thisUpdate - startOfMonth) / (1000 * 3600000)
                : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) + energyMonthlyAcc;
            await this.device.setCapabilityValue(`meter_power.month`, newEnergyMonthlyAcc);

            const energyYearlyAcc = this.device.getCapabilityValue(`meter_power.year`) || 0;
            const newEnergyYearlyAcc = newYear ?
                consumption * (thisUpdate - startOfYear) / (1000 * 3600000)
                : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) + energyYearlyAcc;
            await this.device.setCapabilityValue(`meter_power.year`, newEnergyYearlyAcc);

            this.device.logger.debug(`Energy calculation:`, newEnergyAcc, newEnergyMonthlyAcc, newEnergyYearlyAcc);
        } catch (err) {
            this.device.logger.error('calculateEnergy failed: ', err);
        }
    }

    async calculateUtilityCost(consumption: number, startValues: StartValues): Promise<void> {
        const {thisUpdate, lastUpdate, startOfDay, newDay, newMonth, newYear} = startValues;
        if (!lastUpdate) {
            return;
        }
        try {
            const price_excl = this.device.getCapabilityValue(`meter_price_excl`) || 0;

            const costTodayExcl = newDay ?
                consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price_excl
                : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price_excl;

            const sumCostTodayExcl = this.device.getCapabilityValue(`meter_cost_today_excl`) || 0;
            const newCostTodayExcl = newDay ? costTodayExcl : costTodayExcl + sumCostTodayExcl;
            await this.device.setCapabilityValue(`meter_cost_today_excl`, newCostTodayExcl);

            const price = this.device.getCapabilityValue(`meter_price_incl`) || 0;

            const utilityFixedAmount = newDay ? this.getUtilityFixedAmountPerDay(startValues) : 0;

            const costToday = newDay ?
                consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price + utilityFixedAmount
                : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price;

            const costYesterday = newDay ?
                consumption * (startOfDay - lastUpdate) / (1000 * 3600000) * price
                : undefined;

            const sumCostToday = this.device.getCapabilityValue(`meter_cost_today`) || 0;
            const newCostToday = newDay ? costToday : costToday + sumCostToday;
            await this.device.setCapabilityValue(`meter_cost_today`, newCostToday);

            if (newDay) {
                await this.device.setCapabilityValue(`meter_cost_yesterday`, sumCostToday + costYesterday);
            }

            const sumCostMonth = this.device.getCapabilityValue(`meter_cost_month`) || 0;
            const newCostMonth = newMonth ? costToday : costToday + sumCostMonth;
            await this.device.setCapabilityValue(`meter_cost_month`, newCostMonth);

            if (newMonth) {
                await this.device.setCapabilityValue(`meter_cost_lastmonth`, sumCostMonth + costYesterday);
            }

            const sumCostYear = this.device.getCapabilityValue(`meter_cost_year`) || 0;
            const newCostYear = newYear ? costToday : costToday + sumCostYear;
            await this.device.setCapabilityValue(`meter_cost_year`, newCostYear);

            if (this.debug) {
                console.log(
                    consumption,
                    startValues,
                    '\ntoday: ',
                    costToday,
                    sumCostToday,
                    newCostToday,
                    '\ncost month: ',
                    sumCostMonth,
                    newCostMonth
                );
            }
            this.device.logger.debug(`Utility calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday},  (this month: ${sumCostMonth})`, this.device.getCapabilityValue(`meter_cost_today`));
        } catch (err) {
            this.device.logger.error('calculateUtilityCost failed: ', err);
        }
    }

    async calculateGridCost(consumption: number, startValues: StartValues) {
        const {thisUpdate, lastUpdate, startOfDay, newDay, newMonth, newYear} = startValues;
        if (!lastUpdate) {
            return;
        }
        try {
            const price = this.device.getCapabilityValue(`meter_gridprice_incl`) || 0;

            const costToday = newDay ?
                (consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price)
                : (consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price);

            const costYesterday = newDay ?
                consumption * (startOfDay - lastUpdate) / (1000 * 3600000) * price
                : undefined;

            const sumCostToday = this.device.getCapabilityValue(`meter_grid_today`) || 0;
            const newCostToday = newDay ? costToday : costToday + sumCostToday;
            await this.device.setCapabilityValue(`meter_grid_today`, newCostToday);

            if (newDay) {
                await this.device.setCapabilityValue(`meter_grid_yesterday`, sumCostToday + costYesterday);
            }

            const sumCostMonth = this.device.getCapabilityValue(`meter_grid_month`) || 0;
            const newCostMonth = newMonth ? costToday : costToday + sumCostMonth;
            await this.device.setCapabilityValue(`meter_grid_month`, newCostMonth);

            // Add grid capacity cost from October this year...
            const dateToday = new Date();
            const gridCapacityCost = ((dateToday.getFullYear() === 2022 && dateToday.getMonth() < 9) || !this.device.hasCapability('meter_cost_capacity')) ? 0 : this.device.getCapabilityValue(`meter_cost_capacity`) || 0;

            if (newMonth) {
                await this.device.setCapabilityValue(`meter_grid_lastmonth`, sumCostMonth + costYesterday + gridCapacityCost);
            }

            const sumCostYear = this.device.getCapabilityValue(`meter_grid_year`) || 0;
            const newCostYear = newYear ? costToday : newMonth ? costToday + sumCostYear + gridCapacityCost : costToday + sumCostYear;
            await this.device.setCapabilityValue(`meter_grid_year`, newCostYear);

            this.device.logger.debug(`Grid calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday}`);
        } catch (err) {
            this.device.logger.error('calculateGridCost failed: ', err);
        }
    }

    calculateConsumptionHour(consumption: number, startValues: StartValues): any {
        const {thisUpdate, lastUpdate, startOfDay, newHour, newMonth} = startValues;
        if (!lastUpdate) {
            return;
        }
        const sumConsumptionHour = this.device.getCapabilityValue(`meter_consumption_hour`) || 0;
        const consumptionWh = consumption * Math.min((thisUpdate - lastUpdate), 3600000) / (3600000);
        const newConsumptionWh = newHour ? consumptionWh : consumptionWh + sumConsumptionHour;

        const sumConsumptionMaxHour = this.device.getCapabilityValue(`meter_consumption_maxmonth`) || 0;
        let newConsumptionMaxMonthWh = undefined;

        if (this.options.addCapabilityCosts) {
            if (newMonth) {
                this.storeValues.highest_10_hours = [];
                newConsumptionMaxMonthWh = consumptionWh;
            } else {
                let aDay = 0;

                this.storeValues.highest_10_hours = (this.storeValues.highest_10_hours ? this.storeValues.highest_10_hours : [])
                    .concat({
                        startOfDay,
                        consumption: newConsumptionWh,
                    })
                    .sort((a, b) => a.startOfDay === b.startOfDay ? b.consumption - a.consumption : a.startOfDay - b.startOfDay)
                    .filter(a => {
                        if (aDay !== a.startOfDay) {
                            aDay = a.startOfDay;
                            return true;
                        }
                        return false;
                    })
                    .sort((a, b) => b.consumption - a.consumption)
                    .slice(0, 10);

                let avgNumHours = this.settings.gridCapacityAverage ? Number(this.settings.gridCapacityAverage) : 1;
                if (avgNumHours > this.storeValues.highest_10_hours.length) {
                    avgNumHours = this.storeValues.highest_10_hours.length;
                }
                const avgConsumption = this.storeValues.highest_10_hours
                    .concat()
                    .map(a => a.consumption)
                    .slice(0, avgNumHours)
                    .reduce((a, b) => a + b, 0) / avgNumHours;

                if (avgConsumption !== sumConsumptionMaxHour) {
                    newConsumptionMaxMonthWh = avgConsumption;
                    this.device.logger.info(`Average highest ${avgNumHours} hours: ${avgConsumption}`, { highest_10_hours: this.storeValues.highest_10_hours });
                }
            }
        } else {
            newConsumptionMaxMonthWh = newMonth ? consumptionWh : (newConsumptionWh > sumConsumptionMaxHour ? newConsumptionWh : undefined);
        }

        this.device.logger.debug(`calculateConsumptionHour:`, { newConsumptionWh, sumConsumptionMaxHour, newConsumptionMaxMonthWh });
        return {newConsumptionWh, sumConsumptionMaxHour, newConsumptionMaxMonthWh};
    }

    async calculateMaxConsumptionHour(consumption: number, startValues: StartValues): Promise<void> {
        const {newMonth} = startValues;
        try {
            const {
                newConsumptionWh,
                sumConsumptionMaxHour,
                newConsumptionMaxMonthWh
            } = this.calculateConsumptionHour(consumption, startValues);
            await this.device.setCapabilityValue(`meter_consumption_hour`, newConsumptionWh);

            if (newConsumptionMaxMonthWh) {
                await this.device.setCapabilityValue(`meter_consumption_maxmonth`, newConsumptionMaxMonthWh);

                const prevLevel = newMonth ? 0 : this.getGridCapacityLevel(sumConsumptionMaxHour);
                const newLevel = this.getGridCapacityLevel(newConsumptionMaxMonthWh);
                if (this.device.hasCapability('meter_cost_capacity')) {
                    const gridCapacityCost = this.getGridCapacity(newConsumptionMaxMonthWh);
                    await this.device.setCapabilityValue(`meter_cost_capacity`, gridCapacityCost);
                }
                if (prevLevel > 0 && newLevel !== prevLevel) {
                    await this.device.homey?.flow?.getDeviceTriggerCard('grid_capacity_level')
                        .trigger(this.device, {
                            meter_consumption_maxmonth: Math.round(newConsumptionMaxMonthWh),
                            grid_capacity_level: newLevel
                        }, {})
                        .catch((err: any) => this.device.logger.error('Trigger grid_capacity_level failed: ', err));
                }
            }
        } catch (err) {
            this.device.logger.error('calculateMaxConsumptionHour failed: ', err);
        }
    }

    async calculateSumCost(consumption: number): Promise<void> {
        try {
            const utilityPrice = this.device.getCapabilityValue(`meter_price_incl`) || 0;
            const gridPrice = this.device.getCapabilityValue(`meter_gridprice_incl`) || 0;

            const sumCurrent = consumption / (1000) * (utilityPrice + gridPrice);
            await this.device.setCapabilityValue(`meter_sum_current`, sumCurrent);

            await this.device.setCapabilityValue(`meter_sum_day`, (this.device.getCapabilityValue(`meter_cost_today`) || 0) + (this.device.getCapabilityValue(`meter_grid_today`) || 0));
            await this.device.setCapabilityValue(`meter_sum_month`, (this.device.getCapabilityValue(`meter_cost_month`) || 0) + (this.device.getCapabilityValue(`meter_grid_month`) || 0));
            await this.device.setCapabilityValue(`meter_sum_year`, (this.device.getCapabilityValue(`meter_cost_year`) || 0) + (this.device.getCapabilityValue(`meter_grid_year`) || 0));

            const meter_cost_today_excl = this.device.getCapabilityValue(`meter_cost_today_excl`);
            const meter_sum_day = this.device.getCapabilityValue(`meter_sum_day`);
            const meter_power_acc = this.device.getCapabilityValue(`meter_power.acc`);
            if (this.settings.dailyConsumptionExclTaxes === 'EXCL') {
                await this.device.setCapabilityValue(`meter_avg_daily_consumption`, meter_power_acc ? meter_cost_today_excl / meter_power_acc : 0);
            } else {
                await this.device.setCapabilityValue(`meter_avg_daily_consumption`, meter_power_acc ? meter_sum_day / meter_power_acc : 0);
            }

            this.device.logger.info(`Calculate sum cost: ${meter_sum_day}`);
        } catch (err) {
            this.device.logger.error('calculateSumCost failed: ', err);
        }
    }

    getUtilityFixedAmountPerDay(startValues: StartValues): number {
        const costFormulaFixedAmount = this.settings.costFormulaFixedAmount;
        try {
            if (this.options.addFixedUtilityCosts !== true) {
                return 0;
            }

            const monthlyCost = this.evaluateFixedAmount(costFormulaFixedAmount, startValues.now);
            const monthStart = moment(startValues.now).startOf('month');
            const monthEnd = moment(startValues.now).startOf('month').add(1, 'month');
            const numDaysInMonth = monthEnd.diff(monthStart, 'days');

            return monthlyCost / numDaysInMonth;
        } catch (err) {
            this.device.logger.error(`getUtilityFixedAmountPerDay failed: "${costFormulaFixedAmount}"`, err);
        }
        return 0;
    }

    getGridCapacity(sumConsumptionMaxHour: number): number {
        if (sumConsumptionMaxHour < 2000) {
            return this.settings.gridCapacity0_2;
        } else if (sumConsumptionMaxHour >= 2000 && sumConsumptionMaxHour < 5000) {
            return this.settings.gridCapacity2_5;
        } else if (sumConsumptionMaxHour >= 5000 && sumConsumptionMaxHour < 10000) {
            return this.settings.gridCapacity5_10;
        } else if (sumConsumptionMaxHour >= 10000 && sumConsumptionMaxHour < 15000) {
            return this.settings.gridCapacity10_15;
        } else if (sumConsumptionMaxHour >= 15000 && sumConsumptionMaxHour < 20000) {
            return this.settings.gridCapacity15_20;
        } else if (sumConsumptionMaxHour >= 20000) {
            return this.settings.gridCapacity20_25;
        }
        return this.settings.gridCapacity20_25;
    }

    getGridCapacityLevel(sumConsumptionMaxHour: number): number {
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
        return 5;
    }

}