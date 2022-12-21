import Homey from 'homey';
import {DeviceHandler} from "./DeviceHandler";
const { default: PQueue } = require('p-queue');

const Logger = require('./Logger');

export class BaseDevice extends Homey.Device {

    logger: any;
    _dh!: DeviceHandler;
    _deleted?: boolean;
    fetchTimeout?: NodeJS.Timeout;
    updatePriceTimeout?: NodeJS.Timeout;
    checkTimeout?: NodeJS.Timeout;
    commandQueue: any;

    async onInit(): Promise<void> {
        this.logger = new Logger({
            logFunc: this.log,
            errorFunc: this.error,
        });
        this.commandQueue = new PQueue({ concurrency: 1 });
        this._dh = new DeviceHandler(this);
    }

    onDeleted() {
        this._deleted = true;
        this.clearFetchData();
        this.clearUpdatePrice();
        this.clearCheckTime();
        this.logger.verbose(this.getName() + ' -> device deleted');
    }

    getDeviceHandler(): DeviceHandler {
        return this._dh;
    }

    clearFetchData() {
        if (this.fetchTimeout) {
            this.homey.clearTimeout(this.fetchTimeout);
            this.fetchTimeout = undefined;
        }
    }

    scheduleFetchData(seconds?: number) {
        if (this._deleted) {
            return;
        }
        this.clearFetchData();
        if (seconds === undefined) {
            let syncTime = this.getStoreValue('syncTime');
            if (syncTime === undefined || syncTime === null) {
                syncTime = Math.round(Math.random() * 3600);
                this.setStoreValue('syncTime', syncTime).catch((err: any) => this.logger.error(err));
            }
            const now = new Date();
            seconds = syncTime - (now.getMinutes() * 60 + now.getSeconds());
            seconds = seconds <= 0 ? seconds + 3600 : seconds;
            this.logger.verbose(`Sync time: ${syncTime}`);
        }
        this.logger.debug(`Fetch data in ${seconds} seconds`);
        this.fetchTimeout = this.homey.setTimeout(this.doFetchData.bind(this), seconds * 1000);
    }

    async doFetchData() {
        throw new Error('Not implemented');
    }

    clearUpdatePrice() {
        if (this.updatePriceTimeout) {
            this.homey.clearTimeout(this.updatePriceTimeout);
            this.updatePriceTimeout = undefined;
        }
    }

    scheduleUpdatePrice(seconds?: number) {
        if (this._deleted) {
            return;
        }
        this.clearUpdatePrice();
        if (seconds === undefined) {
            const now = new Date();
            seconds = 3 - (now.getMinutes() * 60 + now.getSeconds()); // 3 seconds after top of the hour
            seconds = seconds <= 0 ? seconds + 3600 : seconds;
        }
        this.logger.debug(`Update price in ${seconds} seconds`);
        this.updatePriceTimeout = this.homey.setTimeout(this.doUpdatePrice.bind(this), seconds * 1000);
    }

    async doUpdatePrice() {
        throw new Error('Not implemented');
    }

    clearCheckTime() {
        if (this.checkTimeout) {
            this.homey.clearTimeout(this.checkTimeout);
            this.checkTimeout = undefined;
        }
    }

    scheduleCheckTime(seconds = 60) {
        if (this._deleted) {
            return;
        }
        this.clearCheckTime();
        this.logger.debug(`Checking time in ${seconds} seconds`);
        this.checkTimeout = this.homey.setTimeout(this.doCheckTime.bind(this), seconds * 1000);
    }

    async doCheckTime() {
        throw new Error('Not implemented');
    }

    async updatePriceDecimals(priceDecimals: string) {
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
            this.logger.error('Updating number of decimals failed: ', err);
        }
    }

    async onMeterPowerReset() {
        try {
            await this.setCapabilityValue('meter_power.acc', 0);
        } catch (err) {
            this.logger.error('Resetting the power meter failed: ', err);
        }
    }

    async onMeterResetAll() {
        try {
            await this.setCapabilityValue("meter_consumption_hour", 0);
            await this.setCapabilityValue("meter_consumption_maxmonth", 0);
            await this.setCapabilityValue("meter_cost_lastmonth", 0);
            await this.setCapabilityValue("meter_cost_month", 0);
            await this.setCapabilityValue("meter_cost_today", 0);
            await this.setCapabilityValue("meter_cost_year", 0);
            await this.setCapabilityValue("meter_cost_yesterday", 0);
            await this.setCapabilityValue("meter_grid_lastmonth", 0);
            await this.setCapabilityValue("meter_grid_month", 0);
            await this.setCapabilityValue("meter_grid_today", 0);
            await this.setCapabilityValue("meter_grid_year", 0);
            await this.setCapabilityValue("meter_grid_yesterday", 0);
            await this.setCapabilityValue("meter_power.acc", 0);
            await this.setCapabilityValue("meter_power.month", 0);
            await this.setCapabilityValue("meter_power.year", 0);
            await this.setCapabilityValue("meter_sum_day", 0);
            await this.setCapabilityValue("meter_sum_month", 0);
            await this.setCapabilityValue("meter_sum_year", 0);
            if (this.hasCapability('meter_cost_capacity')) {
                await this.setCapabilityValue("meter_cost_capacity", 0);
            }
        } catch (err) {
            this.logger.error('Resetting all values failed: ', err);
        }
    }

}
