import Homey from 'homey';
import {DeviceHandler} from "./DeviceHandler";

const Logger = require('./Logger');

export class BaseDevice extends Homey.Device {

    logger: any;
    _dh!: DeviceHandler;
    _deleted?: boolean;
    curTimeout?: NodeJS.Timeout;

    async onInit(): Promise<void> {
        this.logger = new Logger({
            logFunc: this.log,
            errorFunc: this.error,
        });
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

}
