import {BaseDriver} from '../../lib/BaseDriver';

module.exports = class UtilityCostsDeviceDriver extends BaseDriver {

    getDriverName(): string {
        return this.homey.__('nameDevice');
    }

}