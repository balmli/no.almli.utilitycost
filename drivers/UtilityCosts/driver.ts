import {BaseDriver} from '../../lib/BaseDriver';

module.exports = class UtilityCostsDriver extends BaseDriver {

    getDriverName(): string {
        return this.homey.__('name');
    }

}