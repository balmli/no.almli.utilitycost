import Homey from 'homey';
import {DeviceHandler} from "./DeviceHandler";
const { default: PQueue } = require('p-queue');

const Logger = require('./Logger');

export class BaseDevice extends Homey.Device {

    logger: any;
    _dh!: DeviceHandler;
    _deleted?: boolean;
    curTimeout?: NodeJS.Timeout;
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
        this.clearCheckTime();
        this.logger.verbose(this.getName() + ' -> device deleted');
    }

    getDeviceHandler(): DeviceHandler {
        return this._dh;
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
        this.logger.debug(`Checking time in ${seconds} seconds`);
        this.curTimeout = this.homey.setTimeout(this.checkTime.bind(this), seconds * 1000);
    }

    async checkTime() {
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
