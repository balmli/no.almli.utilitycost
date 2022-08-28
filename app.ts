import Homey from 'homey';
import moment from "./lib/moment-timezone-with-data";
import {DeviceHandler} from "./lib/DeviceHandler";

class UtilityCostsApp extends Homey.App {

    async onInit() {
        moment.tz.setDefault(this.homey.clock.getTimezone());
        await this._initFlows();
        this.log('UtilityCostsApp is running...');
    }

    async _initFlows() {
        this.homey.flow.getConditionCard('price_incl_below')
            .registerRunListener(args => args.device.getCapabilityValue(`meter_price_incl`) < args.price);

        this.homey.flow.getConditionCard('gridprice_incl_below')
            .registerRunListener(args => args.device.getCapabilityValue(`meter_gridprice_incl`) < args.price);

        this.homey.flow.getConditionCard('sum_current_below')
            .registerRunListener(args => args.device.getCapabilityValue(`meter_sum_current`) < args.sum_current);

        this.homey.flow.getActionCard('update_consumption')
            .registerRunListener((args, state) => args.device.onUpdateConsumption(args.consumption));

        this.homey.flow.getActionCard('update_energy')
            .registerRunListener((args, state) => args.device.onUpdateEnergy(args.energy));

        this.homey.flow.getActionCard('update_price')
            .registerRunListener((args, state) => args.device.onUpdatePrice(args.price));

        this.homey.flow.getActionCard('set_utility_costs_settings')
            .registerRunListener((args, state) => args.device.onSetUtilityCostsSettings(args));

        this.homey.flow.getActionCard('set_gridcapacity_settings')
            .registerRunListener((args, state) => args.device.onSetGridCapacitySettings(args));

        this.homey.flow.getActionCard('set_gridenergy_settings')
            .registerRunListener((args, state) => args.device.onSetGridEnergySettings(args));

        this.homey.flow.getActionCard('meter_power_reset')
            .registerRunListener((args, state) => args.device.onMeterPowerReset());

        this.homey.flow.getActionCard('meter_reset_all')
            .registerRunListener((args, state) => args.device.onMeterResetAll());

        this.homey.flow.getActionCard('fetch_config_data')
            .registerRunListener((args, state) => args.device.onFetchConfigData());
    }

    getDeviceHandler(): DeviceHandler | undefined {
        const driver = this.homey.drivers.getDriver('UtilityCosts');
        const devices = driver.getDevices();
        if (devices.length > 0) {
            // @ts-ignore
            return devices[0].getDeviceHandler();
        }
    }

    async getPrices(): Promise<void> {
        const driver = this.homey.drivers.getDriver('UtilityCosts');
        const devices = driver.getDevices();
        if (devices.length > 0) {
            // @ts-ignore
            return devices[0].getPrices();
        }
    }

    async getGridCosts(): Promise<void> {
        const driver = this.homey.drivers.getDriver('UtilityCosts');
        const devices = driver.getDevices();
        if (devices.length > 0) {
            // @ts-ignore
            return devices[0].getGridCosts();
        }
    }

}

module.exports = UtilityCostsApp;
