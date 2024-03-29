'use strict';

import moment from 'moment-timezone';

import {BaseDevice} from '../../lib/BaseDevice';

module.exports = class UtilityCostsDevice extends BaseDevice {

    async onInit(): Promise<void> {
        super.onInit();
        this._dh.setOptions({
            addFixedUtilityCosts: false,
            addCapabilityCosts: false
        });
        await this.migrate();
        this.scheduleCheckTime(5);
        this.logger.verbose(this.getName() + ' -> device initialized');
    }

    async migrate() {
        try {
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
            if (!!migVersion && migVersion < 2) {
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
                await this._dh.storeStoreValues();
            }
            if (!!migVersion && migVersion < 4) {
                const meter_power_year = this.getCapabilityValue('meter_power.year');
                await this.removeCapability('meter_cost_capacity');
                await this.removeCapability('meter_power.year');
                if (!this.hasCapability('meter_power.month')) {
                    await this.addCapability('meter_power.month');
                }
                await this.addCapability('meter_power.year');
                await this.setCapabilityValue('meter_power.year', meter_power_year);
            }
            if (!!migVersion && migVersion < 5) {
                const meter_power_year = this.getCapabilityValue('meter_power.year');
                await this.removeCapability('meter_power.year');
                if (!this.hasCapability('meter_power.prevmonth')) {
                    await this.addCapability('meter_power.prevmonth');
                    await this.setCapabilityValue('meter_power.prevmonth', 0).catch((err: any) => this.logger.error(err));
                }
                await this.addCapability('meter_power.year');
                await this.setCapabilityValue('meter_power.year', meter_power_year).catch((err: any) => this.logger.error(err));
                if (!this.hasCapability('meter_avg_daily_consumption')) {
                    await this.addCapability('meter_avg_daily_consumption');
                }
            }
            if (!!migVersion && migVersion < 6) {
                if (!this.hasCapability('meter_cost_today_excl')) {
                    await this.addCapability('meter_cost_today_excl');
                }
            }
            if (!!migVersion && migVersion < 7) {
                const priceDecimals = this.getSetting('priceDecimals');
                await this.updatePriceDecimals(priceDecimals);
            }
            await this.setStoreValue('version', 7).catch((err: any) => this.logger.error(err));
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
        if (changedKeys.includes('priceDecimals')) {
            await this.updatePriceDecimals(newSettings.priceDecimals);
        }
    }

    async doCheckTime() {
        if (this._deleted) {
            return;
        }
        try {
            this.clearCheckTime();

            // @ts-ignore
            const globalDeviceHandler = this.homey.app.getDeviceHandler();

            if (globalDeviceHandler) {
                this.updateSettings();

                // Copy prices
                await this.setCapabilityValue('meter_price_excl', globalDeviceHandler.device.getCapabilityValue('meter_price_excl'));
                await this.setCapabilityValue('meter_price_incl', globalDeviceHandler.device.getCapabilityValue('meter_price_incl'));

                const localTime = moment();
                await this._dh.gridPriceCalculation(localTime);
                if (this._dh.getStoreValues().consumptionMinute) {
                    this.commandQueue.add(async () => {
                        await this._dh.updateConsumption(undefined, localTime);
                    });
                }
            } else {
                this.logger.warn(`Unable to calculate: no master device`);
            }
        } catch (err) {
            this.logger.error(err);
        } finally {
            await this._dh.storeStoreValues();
            this.scheduleCheckTime();
        }
    }

    async onUpdateConsumption(consumption: number) {
        this.logger.debug(`New consumption: ${consumption}`);
        this.commandQueue.add(async () => {
            this.updateSettings();
            this._dh.getStoreValues().consumptionMinute = true;
            await this._dh.updateConsumption(consumption, moment());
        });
    }

    async onUpdateEnergy(energy: number) {
        this.logger.debug(`New energy: ${energy}`);
        this.commandQueue.add(async () => {
            this.updateSettings();
            this._dh.getStoreValues().consumptionMinute = false;
            await this._dh.updateEnergy(energy, moment());
        });
    }

    updateSettings(): void {
        // @ts-ignore
        const globalDeviceHandler = this.homey.app.getDeviceHandler();
        if (globalDeviceHandler) {
            this._dh.setSettings({
                ...globalDeviceHandler.getSettings(),
                priceDecimals: this.getSetting('priceDecimals'),
                dailyConsumptionExclTaxes: this.getSetting('dailyConsumptionExclTaxes'),
                resetEnergyDaily: this.getSetting('resetEnergyDaily')
            });
        }
    }

};
