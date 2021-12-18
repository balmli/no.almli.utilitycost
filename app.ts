import Homey from 'homey';

const days = require('./lib/days');

class UtilityCostsApp extends Homey.App {

    async onInit() {
        days.setTimeZone(this.homey.clock.getTimezone());
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

        this.homey.flow.getActionCard('update_price')
            .registerRunListener((args, state) => args.device.onUpdatePrice(args.price));
    }
}

module.exports = UtilityCostsApp;
