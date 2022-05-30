import Homey from 'homey';
import moment from "./lib/moment-timezone-with-data";
import {DeviceHandler} from "./lib/DeviceHandler";

class UtilityCostsApp extends Homey.App {

    heatingControllerApi: any;
    heatingControllerApiOk?: boolean;

    async onInit() {
        moment.tz.setDefault(this.homey.clock.getTimezone());
        this.heatingControllerApi = this.homey.api.getApiApp('no.almli.heatingcontroller');
        this.heatingControllerApi.on('install', async () => {
            await this._checkApi();
        });
        this.heatingControllerApi.on('uninstall', async () => {
            await this._checkApi();
        });
        await this._checkApi();
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

        this.homey.flow.getActionCard('set_grid_costs_settings')
            .registerRunListener((args, state) => args.device.onSetGridCostsSettings(args));

        this.homey.flow.getActionCard('set_gridcapacity_settings')
            .registerRunListener((args, state) => args.device.onSetGridCapacitySettings(args));

        this.homey.flow.getActionCard('set_gridenergy_settings')
            .registerRunListener((args, state) => args.device.onSetGridEnergySettings(args));

        this.homey.flow.getActionCard('meter_power_reset')
            .registerRunListener((args, state) => args.device.onMeterPowerReset());

        this.homey.flow.getActionCard('meter_reset_all')
            .registerRunListener((args, state) => args.device.onMeterResetAll());

    }

    getDeviceHandler(): DeviceHandler | undefined {
        const driver = this.homey.drivers.getDriver('UtilityCosts');
        const devices = driver.getDevices();
        if (devices.length > 0) {
            // @ts-ignore
            return devices[0].getDeviceHandler();
        }
    }

    async _checkApi(): Promise<void> {
        try {
            this.heatingControllerApiOk = false;
            const isInstalled = await this.heatingControllerApi.getInstalled();
            const version = await this.heatingControllerApi.getVersion();
            if (isInstalled && !!version) {
                const split = version.split('.');
                this.heatingControllerApiOk = (Number(split[0]) >= 1 && Number(split[1]) >= 10);
                this.log(`Heating Controller: ${version} installed${this.heatingControllerApiOk ? ' and ready' : ', but not ready'}`, split);
            } else {
                this.log(`Heating Controller: not installed`);
            }
        } catch (err: any) {
            this.log(`Checking Heating Controller API: ${err.message}`);
        }
    }

    async updatePrices(prices: any): Promise<void> {
        if (!!prices && this.heatingControllerApiOk) {
            try {
                await this.heatingControllerApi.post('/prices', prices);
            } catch (err) {
                this.log('Posting prices to Heating Controller failed: ', err);
            }
        }
    }

}

module.exports = UtilityCostsApp;
