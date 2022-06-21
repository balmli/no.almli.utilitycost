'use strict';

import {BaseDevice} from '../../lib/BaseDevice';

const moment = require('../../lib/moment-timezone-with-data');
const pricesLib = require('../../lib/prices');
const nordpool = require('../../lib/nordpool');
import {DeviceSettings} from '../../lib/types';
import {GridCosts} from "../../lib/constants";

module.exports = class UtilityCostsDevice extends BaseDevice {

    _lastFetchData: any;
    _lastPrice: any;
    _prices: any;

    async onInit(): Promise<void> {
        super.onInit();

        this._lastFetchData = undefined;
        this._lastPrice = undefined;
        this._prices = undefined;

        await this.migrate();
        this.scheduleCheckTime(5);
        this.logger.verbose(this.getName() + ' -> device initialized');
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
            if (!this.hasCapability('meter_power.acc')) {
                await this.addCapability('meter_power.acc');
            }
            if (!this.hasCapability('meter_power.year')) {
                await this.addCapability('meter_power.year');
            }
            if (!this.hasCapability('meter_energy')) {
                await this.addCapability('meter_energy');
            }
            const migVersion = this.getStoreValue('version');
            if (!migVersion || migVersion < 2) {
                const consumptionMinute = this.getStoreValue('consumptionMinute');
                if (consumptionMinute !== undefined && consumptionMinute !== null) {
                    this._dh.getStoreValues().consumptionMinute = consumptionMinute;
                    this.unsetStoreValue('consumptionMinute').catch((err: any) => this.logger.error(err));
                }
                const lastConsumptionUpdate = this.getStoreValue('lastConsumptionUpdate');
                if (lastConsumptionUpdate !== undefined && lastConsumptionUpdate !== null) {
                    this._dh.getStoreValues().lastConsumptionUpdate = lastConsumptionUpdate;
                    this.unsetStoreValue('lastConsumptionUpdate').catch((err: any) => this.logger.error(err));
                }
                this._dh.getStoreValues().highest_10_hours = [];
                if (!!this.getCapabilityValue(`meter_consumption_maxmonth`)) {
                    const startOfDay = moment().startOf('day').valueOf();
                    this._dh.getStoreValues().highest_10_hours!.push({
                        startOfDay,
                        consumption: this.getCapabilityValue(`meter_consumption_maxmonth`)
                    });
                }
                await this._dh.storeStoreValues();
            }
            await this.setStoreValue('version', 2);
            this.logger.info(this.getName() + ' -> migrated OK');
        } catch (err) {
            this.logger.error(err);
        }
    }

    async onSettings({oldSettings, newSettings, changedKeys}: {
        oldSettings: any;
        newSettings: any;
        changedKeys: string[];
    }): Promise<string | void> {
        if (changedKeys.includes('costFormula')) {
            this._dh.validateCostFormula(newSettings.costFormula);
        }
        if (changedKeys.includes('costFormulaFixedAmount')) {
            this._dh.validateCostFormulaFixedAmount(newSettings.costFormulaFixedAmount);
        }
        if (changedKeys.includes('priceArea')) {
            this._lastFetchData = undefined;
        }
        if (changedKeys.includes('priceDecimals')) {
            await this.updatePriceDecimals(newSettings.priceDecimals);
        }
        if (changedKeys.includes('gridCompany') && newSettings.gridCompany !== 'not_set') {
            const gc = newSettings.gridCompany;
            const gcSettings = GridCosts[gc];
            this.logger.info(`Settings: Grid company: ${newSettings.gridCompany}`, gcSettings);
            newSettings = {
                ...newSettings,
                ...gcSettings.gridSettings
            }
            this.homey.setTimeout(() => {
                this.setSettings({
                    ...gcSettings.gridSettings
                });
            }, 500);
        }
        this._lastPrice = undefined;
        const ds: DeviceSettings = {
            ...newSettings
        };
        this.logger.debug(`Settings: DeviceSettings:`, ds);
        this._dh.setSettings(ds);
        this.scheduleCheckTime(2);
    }

    async checkTime() {
        if (this._deleted) {
            return;
        }
        try {
            this.clearCheckTime();
            const localTime = moment();
            const settings = this.getSettings();
            if (settings.gridCompany !== 'not_set' && !settings.gridNewRegime) {
                const gcSettings = GridCosts[settings.gridCompany];
                const gridNewRegimeStart = moment(gcSettings.gridNewRegimeStart);
                if (localTime.isAfter(gridNewRegimeStart)) {
                    let ds: DeviceSettings = {
                        ...this.getSettings()
                    };
                    ds.gridNewRegime = true;
                    await this.setSettings(ds);
                    this._dh.setSettings(ds);
                    this.logger.info(`Automatically switched to new grid regime.`);
                }
            }
            if (settings.priceCalcMethod === 'nordpool_spot') {
                if (this.shallFetchSpotPrices()) {
                    await this.fetchSpotPrices();
                }
                if (this._prices) {
                    await this.onSpotPrices();
                }
            } else if (settings.priceCalcMethod === 'fixed') {
                await this.onFixedPrices();
            }
            await this._dh.gridPriceCalculation(localTime);
            if (this._dh.getStoreValues().consumptionMinute) {
                this.commandQueue.add(async () => {
                    await this._dh.updateConsumption(undefined, localTime);
                });
            }
        } catch (err) {
            this.logger.error(err);
        } finally {
            await this._dh.storeStoreValues();
            this.scheduleCheckTime();
        }
    }

    shallFetchSpotPrices() {
        return !this._prices
            || !this._lastFetchData
            || pricesLib.toHour(this._lastFetchData) !== pricesLib.toHour(moment());
    }

    async fetchSpotPrices() {
        try {
            const settings = this.getSettings();
            const priceArea = settings.priceArea || 'Bergen';
            this.logger.verbose('Will fetch prices:', this.getData().id, priceArea);
            const localTime = moment().startOf('day');
            const prices = await nordpool.fetchPrices(localTime, {priceArea, currency: 'NOK'});
            if (prices) {
                this._lastFetchData = moment();
                this._prices = prices;
                this.logger.info('Got prices:', this.getData().id, prices.length);
            }
        } catch (err) {
            this.logger.error(err);
        }
    }

    async onSpotPrices() {
        try {
            const localTime = moment();

            const currentPrice = pricesLib.currentPrice(this._prices, localTime);
            const startAtHour = currentPrice ? pricesLib.toHour(currentPrice.startsAt) : undefined;
            if (currentPrice) {
                this.logger.verbose('Current price:', startAtHour, currentPrice.price);
                const priceChanged = !this._lastPrice || startAtHour !== pricesLib.toHour(this._lastPrice.startsAt);
                if (priceChanged) {
                    this._lastPrice = currentPrice;
                    await this._dh.spotPriceCalculation(currentPrice.price);
                }
            }
        } catch (err) {
            this.logger.error(err);
        }
    }

    async onFixedPrices() {
        try {
            await this._dh.fixedPriceCalculation();
        } catch (err) {
            this.logger.error(err);
        }
    }

    async onUpdatePrice(price: number) {
        this.logger.debug(`New price: ${price}`);
        await this._dh.updatePrice(price);
    }

    async onUpdateConsumption(consumption: number) {
        this.logger.debug(`New consumption: ${consumption}`);
        this.commandQueue.add(async () => {
            this._dh.getStoreValues().consumptionMinute = true;
            await this._dh.updateConsumption(consumption, moment());
        });
    }

    async onUpdateEnergy(energy: number) {
        this.logger.debug(`New energy: ${energy}`);
        this.commandQueue.add(async () => {
            this._dh.getStoreValues().consumptionMinute = false;
            await this._dh.updateEnergy(energy, moment());
        });
    }

    async onSetUtilityCostsSettings(args: any) {
        try {
            let ds: DeviceSettings = {
                ...this.getSettings()
            };
            if (args.costFormula !== undefined) ds.costFormula = args.costFormula;
            if (args.costFormulaFixedAmount !== undefined) ds.costFormulaFixedAmount = args.costFormulaFixedAmount;
            await this.setSettings(ds);
            this._dh.setSettings(ds);
            this.scheduleCheckTime(2);
        } catch (err) {
            this.logger.error('onSetUtilityCostsSettings', err);
        }
    }

    async onSetGridCostsSettings(args: any) {
        try {
            let ds: DeviceSettings = {
                ...this.getSettings()
            };
            if (args.gridFixedAmount !== undefined) ds.gridFixedAmount = args.gridFixedAmount;
            if (args.gridConsumption !== undefined) ds.gridConsumption = args.gridConsumption;
            if (args.gridNewRegime !== undefined) ds.gridNewRegime = args.gridNewRegime === 'true';
            await this.setSettings(ds);
            this._dh.setSettings(ds);
            this.scheduleCheckTime(2);
        } catch (err) {
            this.logger.error('onSetGridCostsSettings', err);
        }
    }

    async onSetGridCapacitySettings(args: any) {
        try {
            let ds: DeviceSettings = {
                ...this.getSettings()
            };
            if (args.gridCapacity0_2 !== undefined) ds.gridCapacity0_2 = args.gridCapacity0_2;
            if (args.gridCapacity2_5 !== undefined) ds.gridCapacity2_5 = args.gridCapacity2_5;
            if (args.gridCapacity5_10 !== undefined) ds.gridCapacity5_10 = args.gridCapacity5_10;
            if (args.gridCapacity10_15 !== undefined) ds.gridCapacity10_15 = args.gridCapacity10_15;
            if (args.gridCapacity15_20 !== undefined) ds.gridCapacity15_20 = args.gridCapacity15_20;
            if (args.gridCapacity20_25 !== undefined) ds.gridCapacity20_25 = args.gridCapacity20_25;
            await this.setSettings(ds);
            this._dh.setSettings(ds);
            this.scheduleCheckTime(2);
        } catch (err) {
            this.logger.error('onSetGridCapacitySettings', err);
        }
    }

    async onSetGridEnergySettings(args: any) {
        try {
            let ds: DeviceSettings = {
                ...this.getSettings()
            };
            if (args.gridEnergyDay !== undefined) ds.gridEnergyDay = args.gridEnergyDay;
            if (args.gridEnergyNight !== undefined) ds.gridEnergyNight = args.gridEnergyNight;
            if (args.gridEnergyLowWeekends !== undefined) ds.gridEnergyLowWeekends = args.gridEnergyLowWeekends === 'true';
            await this.setSettings(ds);
            this._dh.setSettings(ds);
            this.scheduleCheckTime(2);
        } catch (err) {
            this.logger.error('onSetGridEnergySettings', err);
        }
    }

    getPrices() {
        const settings = this.getSettings();
        if (settings.priceCalcMethod === 'nordpool_spot' && this._prices) {
            return this._prices
                .map((p: { startsAt: any, time: number, price: number }) => {
                    return {
                        time: p.time,
                        price: this._dh.calcSpotPrice(p.price) + this._dh.calcGridPrice(p.startsAt)
                    };
                });
        } else if (settings.priceCalcMethod === 'fixed') {
            const utilityPrice = this.getCapabilityValue(`meter_price_incl`) || 0;
            const dayStart = moment().startOf('day');
            return [...Array(24).keys()]
                .map((_, i) => {
                    const time = dayStart.unix() + i * 3600;
                    const startsAt = moment(time * 1000);
                    const price = utilityPrice + this._dh.calcGridPrice(startsAt);
                    return {time, price};
                });
        }
    }
};
