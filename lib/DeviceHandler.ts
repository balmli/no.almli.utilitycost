import moment from "./moment-timezone-with-data";

const Formula = require('fparser');

export class StartValues {
    now!: any;
    thisUpdate!: number;
    lastUpdate?: number;
    startOfHour!: number;
    startOfDay!: number;
    startOfMonth!: number;
    startOfYear!: number;
    newHour!: boolean;
    newDay!: boolean;
    newMonth!: boolean;
    newYear!: boolean;
}

export class DeviceHandler {

    device: any;

    constructor(homeyDevice: any) {
        this.device = homeyDevice;
    }

    evaluatePrice(str: string, price?: number) {
        const str2 = str.replace(/PRICE_NORDPOOL/g, `[PRICE_NORDPOOL]`);
        const parser = new Formula(str2);
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

    roundPrice(price: number) {
        return Math.round(100000 * price) / 100000;
    }

    async spotPriceCalculation(price: number) {
        const costFormula = this.device.getSetting('costFormula');
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

    async fixedPriceCalculation() {
        const costFormula = this.device.getSetting('costFormula');
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
        const costFormula = this.device.getSetting('costFormula');
        try {
            const settings = this.device.getSettings();
            if (settings.gridNewRegime) {
                const momentNow = moment(aDate);

                const dayStart = moment(aDate).startOf('day').add(6, 'hour');
                const dayEnd = moment(aDate).startOf('day').add(22, 'hour');
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

                this.device.logger.debug(`Get grid energy price (new regime): Weekend: ${isWeekend}, Low Price: ${lowPrice}, winterStart: ${winterStart}, summerStart: ${summerStart}, isSummerPeriod: ${isSummerPeriod}, price: ${price}`);
                const gridConsumptionPrice = this.roundPrice(price);
                await this.device.setCapabilityValue('meter_gridprice_incl', gridConsumptionPrice);
                const utilityPrice = this.device.getCapabilityValue(`meter_price_incl`) || 0;
                await this.device.setCapabilityValue('meter_price_sum', gridConsumptionPrice + utilityPrice);
            } else {
                const gridConsumptionPrice = settings.gridConsumption;
                this.device.logger.debug(`Get grid energy price (old regime): price: ${gridConsumptionPrice}`);
                await this.device.setCapabilityValue('meter_gridprice_incl', gridConsumptionPrice);
                const utilityPrice = this.device.getCapabilityValue(`meter_price_incl`) || 0;
                await this.device.setCapabilityValue('meter_price_sum', gridConsumptionPrice + utilityPrice);
            }
        } catch (err) {
            this.device.logger.error(`Grid price formula failed: "${costFormula}"`, err);
        }
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
        const startOfHour = now.startOf('hour').valueOf();
        const startOfDay = now.startOf('day').valueOf();
        const startOfMonth = now.startOf('month').valueOf();
        const startOfYear = now.startOf('year').valueOf();

        const lastUpdate = this.device.getStoreValue('lastConsumptionUpdate');
        await this.device.setStoreValue('lastConsumptionUpdate', thisUpdate);

        const newHour = (lastUpdate < startOfHour) && (thisUpdate >= startOfHour);
        const newDay = (lastUpdate < startOfDay) && (thisUpdate >= startOfDay);
        const newMonth = (lastUpdate < startOfMonth) && (thisUpdate >= startOfMonth);
        const newYear = (lastUpdate < startOfYear) && (thisUpdate >= startOfYear);

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
        const momentNow = moment(aDate);
        const startOfValues = await this.startOfValues(momentNow);
        if (consumption === undefined) {
            consumption = this.device.getCapabilityValue('meter_consumption');
        } else {
            await this.device.setCapabilityValue('meter_consumption', consumption);
        }
        if (consumption !== undefined && consumption !== null && startOfValues.lastUpdate) {
            await this.calculateUtilityCost(consumption, startOfValues);
            await this.calculateGridCost(consumption, startOfValues);
            await this.calculateMaxConsumptionHour(consumption, startOfValues);
            await this.calculateSumCost(consumption);
        }
    }

    async calculateUtilityCost(consumption: number, startValues: StartValues): Promise<void> {
        const {thisUpdate, lastUpdate, startOfDay, newDay, newMonth, newYear} = startValues;
        if (!lastUpdate) {
            return;
        }
        try {
            const price = this.device.getCapabilityValue(`meter_price_incl`) || 0;

            const costToday = newDay ?
                consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price
                : consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price;

            const costYesterday = newDay ?
                consumption * (startOfDay - lastUpdate) / (1000 * 3600000) * price
                : undefined;

            const sumCostToday = this.device.getCapabilityValue(`meter_cost_today`) || 0;
            const newCostToday = newDay ? costToday : costToday + sumCostToday;
            if (newCostToday !== undefined) {
                await this.device.setCapabilityValue(`meter_cost_today`, newCostToday);
            }

            const newCostYesterday = newDay ? sumCostToday + costYesterday : undefined;
            if (newCostYesterday !== undefined) {
                await this.device.setCapabilityValue(`meter_cost_yesterday`, newCostYesterday);
            }

            const sumCostMonth = this.device.getCapabilityValue(`meter_cost_month`) || 0;
            const newCostMonth = newMonth ? costToday : costToday + sumCostMonth;
            if (newCostMonth !== undefined) {
                await this.device.setCapabilityValue(`meter_cost_month`, newCostMonth);
            }

            const newCostLastMonth = newMonth ? sumCostMonth + costYesterday : undefined;
            if (newCostLastMonth !== undefined) {
                await this.device.setCapabilityValue(`meter_cost_lastmonth`, newCostLastMonth);
            }

            const sumCostYear = this.device.getCapabilityValue(`meter_cost_year`) || 0;
            const newCostYear = newYear ? costToday : costToday + sumCostYear;
            if (newCostYear !== undefined) {
                await this.device.setCapabilityValue(`meter_cost_year`, newCostYear);
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

            const gridFixedAmount = newDay ? this.getGridFixedAmountPerDay(startValues) : 0;
            const gridCapacityCost = newDay ?
                this.getGridCapacityAddedCost(consumption, startValues)
                : this.getGridCapacityAddedCost(consumption, startValues);

            const costToday = newDay ?
                (consumption * (thisUpdate - startOfDay) / (1000 * 3600000) * price + gridFixedAmount + gridCapacityCost)
                : (consumption * (thisUpdate - lastUpdate) / (1000 * 3600000) * price + gridCapacityCost);

            const costYesterday = newDay ?
                consumption * (startOfDay - lastUpdate) / (1000 * 3600000) * price
                : undefined;

            const sumCostToday = this.device.getCapabilityValue(`meter_grid_today`) || 0;
            const newCostToday = newDay ? costToday : costToday + sumCostToday;
            if (newCostToday !== undefined) {
                await this.device.setCapabilityValue(`meter_grid_today`, newCostToday);
            }

            const newCostYesterday = newDay ? sumCostToday + costYesterday : undefined;
            if (newCostYesterday !== undefined) {
                await this.device.setCapabilityValue(`meter_grid_yesterday`, newCostYesterday);
            }

            const sumCostMonth = this.device.getCapabilityValue(`meter_grid_month`) || 0;
            const newCostMonth = newMonth ? costToday : costToday + sumCostMonth;
            if (newCostMonth !== undefined) {
                await this.device.setCapabilityValue(`meter_grid_month`, newCostMonth);
            }

            const newCostLastMonth = newMonth ? sumCostMonth + costYesterday : undefined;
            if (newCostLastMonth !== undefined) {
                await this.device.setCapabilityValue(`meter_grid_lastmonth`, newCostLastMonth);
            }

            const sumCostYear = this.device.getCapabilityValue(`meter_grid_year`) || 0;
            const newCostYear = newYear ? costToday : costToday + sumCostYear;
            if (newCostYear !== undefined) {
                await this.device.setCapabilityValue(`meter_grid_year`, newCostYear);
            }

            this.device.logger.debug(`Grid calculation: Price: ${price}, Cost last ${thisUpdate - lastUpdate} ms: ${costToday}`);
        } catch (err) {
            this.device.logger.error('calculateGridCost failed: ', err);
        }
    }

    calculateConsumptionHour(consumption: number, startValues: StartValues): any {
        const {thisUpdate, lastUpdate, newHour, newMonth} = startValues;
        if (!lastUpdate) {
            return;
        }
        const sumConsumptionHour = this.device.getCapabilityValue(`meter_consumption_hour`) || 0;
        const consumptionWh = consumption * Math.min((thisUpdate - lastUpdate), 3600000) / (3600000);
        const newConsumptionWh = newHour ? consumptionWh : consumptionWh + sumConsumptionHour;

        const sumConsumptionMaxHour = this.device.getCapabilityValue(`meter_consumption_maxmonth`) || 0;
        const newConsumptionMaxMonthWh = newMonth ? consumptionWh : (newConsumptionWh > sumConsumptionMaxHour ? newConsumptionWh : undefined);

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
                if (newLevel > prevLevel) {
                    await this.device.homey?.flow?.getDeviceTriggerCard('grid_capacity_level')
                        .trigger(this, {
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

            this.device.logger.debug(`Calculate sum cost: ${this.device.getCapabilityValue(`meter_sum_day`)}`);
        } catch (err) {
            this.device.logger.error('calculateSumCost failed: ', err);
        }
    }

    getGridFixedAmountPerDay(startValues: StartValues): number {
        try {
            const settings = this.device.getSettings();
            const yearStart = moment(startValues.now).startOf('year');
            const yearEnd = moment(startValues.now).startOf('year').add(1, 'year');
            const numDaysInYear = yearEnd.diff(yearStart, 'days');
            return settings.gridNewRegime ? 0 : settings.gridFixedAmount / numDaysInYear;
        } catch (err) {
            this.device.logger.error('getGridFixedAmountPerDay failed: ', err);
        }
        return 0;
    }

    getGridCapacityAddedCost(consumption: number, startValues: StartValues): number {
        try {
            const settings = this.device.getSettings();
            if (settings.gridNewRegime) {
                const {
                    sumConsumptionMaxHour,
                    newConsumptionMaxMonthWh
                } = this.calculateConsumptionHour(consumption, startValues);

                if (newConsumptionMaxMonthWh) {
                    const prevCost = startValues.newMonth ? 0 : this.getGridCapacity(sumConsumptionMaxHour);
                    const newCost = this.getGridCapacity(newConsumptionMaxMonthWh);
                    return newCost - prevCost;
                }
            }
        } catch (err) {
            this.device.logger.error('getGridCapacityAddedCost failed: ', err);
        }
        return 0;
    }

    getGridCapacity(sumConsumptionMaxHour: number): number {
        const settings = this.device.getSettings();

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
        return settings.gridCapacity20_25;
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