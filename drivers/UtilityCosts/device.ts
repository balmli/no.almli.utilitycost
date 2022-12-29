'use strict';

import moment from 'moment-timezone';
import {Device} from "homey";

import {
    NordpoolOptions,
    NordpoolPrice,
    NordpoolPrices,
    PriceFetcher,
    PriceFetcherMethod,
    PricesFetchClient
} from '@balmli/homey-utility-prices';

import {BaseDevice} from '../../lib/BaseDevice';

import {DeviceSettings} from '../../lib/types';
import {GridCosts} from "../../lib/constants";

module.exports = class UtilityCostsDevice extends BaseDevice {

    pricesFetchClient = new PricesFetchClient({logger: this.log});
    priceFetcher!: PriceFetcher;

    async onInit(): Promise<void> {
        super.onInit();
        await this.migrate();
        this.priceFetcher = new PriceFetcher({
            logger: this.logger,
            pricesFetchClient: this.pricesFetchClient,
            device: this,
        });
        this.priceFetcher.on('prices', this.pricesEvent.bind(this));
        this.priceFetcher.on('priceChanged', this.pricesChangedEvent.bind(this));
        this.setFetcherOptions(this.getSettings());
        this.priceFetcher.start();
        this.scheduleCheckTime(5);
        this.logger.verbose(this.getName() + ' -> device initialized');
    }

    onDeleted() {
        super.onDeleted();
        this.priceFetcher.destroy();
    }

    setFetcherOptions(settings: any) {
        this.priceFetcher.setNordpoolOptions({currency: 'NOK', priceArea: settings.priceArea});
        this.priceFetcher.setFetchMethod(settings.priceCalcMethod === 'nordpool_spot' ?
            PriceFetcherMethod.nordpool :
            PriceFetcherMethod.disabled);

        let syncTime = this.getStoreValue('syncTime');
        if (syncTime === undefined || syncTime === null) {
            syncTime = Math.round(Math.random() * 3600);
            this.setStoreValue('syncTime', syncTime).catch((err: any) => this.logger.error(err));
        }
        this.priceFetcher.setFetchTime(syncTime);
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
            if (!migVersion || migVersion < 3) {
                if (!this.hasCapability('meter_cost_capacity')) {
                    await this.addCapability('meter_cost_capacity');
                    try {
                        const consumptionMaxmonth = this.getCapabilityValue('meter_consumption_maxmonth');
                        const gridCapacityCost = this._dh.getGridCapacity(consumptionMaxmonth);
                        await this.setCapabilityValue(`meter_cost_capacity`, gridCapacityCost);
                    } catch (err1) {
                        this.logger.error(err1);
                    }
                }
            }
            if (!migVersion || migVersion < 4) {
                const meter_power_year = this.getCapabilityValue('meter_power.year');
                const meter_cost_capacity = this.getCapabilityValue('meter_cost_capacity');
                await this.removeCapability('meter_cost_capacity');
                await this.removeCapability('meter_power.year');
                if (!this.hasCapability('meter_power.month')) {
                    await this.addCapability('meter_power.month');
                }
                await this.addCapability('meter_power.year');
                await this.addCapability('meter_cost_capacity');
                await this.setCapabilityValue('meter_power.year', meter_power_year);
                await this.setCapabilityValue('meter_cost_capacity', meter_cost_capacity);
            }
            await this.setStoreValue('version', 4);
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
        const ds: DeviceSettings = {
            ...newSettings
        };
        this.logger.debug(`Settings: DeviceSettings:`, ds);
        this._dh.setSettings(ds);
        this.setFetcherOptions(newSettings);
        this.pricesFetchClient.clearStorage(this);
        this.priceFetcher.start();
        this.scheduleCheckTime(5);
    }

    pricesEvent(prices: NordpoolPrices) {
    }

    async pricesChangedEvent(currentPrice: NordpoolPrice) {
        await this._dh.spotPriceCalculation(currentPrice.price);
    }

    async doCheckTime() {
        if (this._deleted) {
            return;
        }
        try {
            this.clearCheckTime();
            const localTime = moment();
            const settings = this.getSettings();
            if (settings.priceCalcMethod === 'fixed') {
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
        if (settings.priceCalcMethod === 'nordpool_spot') {
            const { fromDate, toDate, options } = this.getFetchParameters();
            const prices = this.pricesFetchClient.getPrices(this as Device, fromDate, toDate, options);
            return prices
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
        return [];
    }

    getFetchParameters() {
        const settings = this.getSettings();
        const fromDate = moment().add(-1, 'day');
        const toDate = moment().add(1, 'day');
        const options: NordpoolOptions = {currency: 'NOK', priceArea: settings.priceArea};
        return { fromDate, toDate, options }
    }

    getGridCosts() {
        const settings = this.getSettings();
        return [
            {limit: 2000, price: settings.gridCapacity0_2},
            {limit: 5000, price: settings.gridCapacity2_5},
            {limit: 10000, price: settings.gridCapacity5_10},
            {limit: 15000, price: settings.gridCapacity10_15},
            {limit: 20000, price: settings.gridCapacity15_20},
            {limit: 25000, price: settings.gridCapacity20_25},
        ];
    }

    async onFetchConfigData(args: any) {
        try {
            const storeValues = this._dh.getStoreValues();
            const highest_hours = storeValues.highest_10_hours ? storeValues.highest_10_hours : [];
            const highest_1 = highest_hours.length > 0 ? highest_hours[0].consumption : 0;
            const highest_2 = highest_hours.length > 1 ? highest_hours[1].consumption : 0;
            const highest_3 = highest_hours.length > 2 ? highest_hours[2].consumption : 0;
            const prices = JSON.stringify(this.getPrices());
            const highest_10_hours = JSON.stringify(highest_hours);
            const device_settings = JSON.stringify(this._dh.getSettings());
            return {
                highest_1,
                highest_2,
                highest_3,
                highest_10_hours,
                prices,
                device_settings,
            };
        } catch (err) {
            this.logger.error('onFetchConfigData', err);
        }
    };

}
