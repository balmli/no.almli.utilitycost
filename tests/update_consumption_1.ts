import {expect} from 'chai';

import {DeviceHandler} from '../lib/DeviceHandler';
import {HomeyDevice} from './HomeyDevice';

describe('Update consumption', function () {

    describe('Check updateConsumption', function () {
        it('Check updateConsumption 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050,
                resetEnergyDaily: true
            });
            device.setCapabilityValue('meter_price_incl', 1.5);
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);

            await dh.updateConsumption(0, '2021-12-31T23:59:00.000+01:00');
            await dh.updateConsumption(0, '2022-01-01T00:00:00.000+01:00');
            await dh.updateConsumption(1000, '2022-01-01T01:00:00.000+01:00');

            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(1000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(1);
            expect(device.getCapabilityValue('meter_power.year')).eq(1);
            expect(device.getCapabilityValue('meter_cost_today')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_cost_month')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(1.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(6.116438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(6.116438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(6.116438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(1000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(2);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(7.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(7.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(7.616438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1000);

            await dh.updateConsumption(2000, '2022-01-02T00:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(2000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(0);
            expect(device.getCapabilityValue('meter_power.year')).eq(47);
            expect(device.getCapabilityValue('meter_cost_today')).eq(0);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(70.5);
            expect(device.getCapabilityValue('meter_cost_month')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(1.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(5.616438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(29.116438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(11.732876, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(11.732876, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(5.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(13.232876, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(13.232876, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(2000);

        });
        it('Check updateConsumption 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050,
                resetEnergyDaily: true
            });
            device.setCapabilityValue('meter_price_incl', 1.5);
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device, {
                addCapabilityCosts: false
            });

            await dh.updateConsumption(0, '2021-12-31T23:59:00.000+01:00');
            await dh.updateConsumption(0, '2022-01-01T00:00:00.000+01:00');
            await dh.updateConsumption(1000, '2022-01-01T01:00:00.000+01:00');

            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(1000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(1);
            expect(device.getCapabilityValue('meter_power.year')).eq(1);
            expect(device.getCapabilityValue('meter_cost_today')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_cost_month')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(1.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(1000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(2);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1000);

            await dh.updateConsumption(2000, '2022-01-02T02:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(2000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(4);
            expect(device.getCapabilityValue('meter_power.year')).eq(51);
            expect(device.getCapabilityValue('meter_cost_today')).eq(6);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(70.5);
            expect(device.getCapabilityValue('meter_cost_month')).eq(7.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(7.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(23.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(2.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(2.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(8, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(10, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(10, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(2000);

        });
        it('Check updateConsumption 3', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                priceCalcMethod: 'nordpool_spot',
                costFormula: 'PRICE_NORDPOOL * 1.25 + 0.0299',
                costFormulaFixedAmount: '39',
                gridFixedAmount: 2050,
                gridConsumption: 0.4123,
                gridNewRegime: false,
                resetEnergyDaily: true,

            });
            const dh = new DeviceHandler(device, {
                addFixedUtilityCosts: true,
                addCapabilityCosts: true
            });

            await dh.spotPriceCalculation(1.1234);
            await dh.gridPriceCalculation('2022-01-01T00:00:00+01:00')

            expect(device.getCapabilityValue('meter_price_incl')).eq(1.43415);
            expect(device.getCapabilityValue('meter_gridprice_incl')).eq(0.4123);
            expect(device.getCapabilityValue('meter_price_sum')).eq(1.84645);

            await dh.updateConsumption(0, '2021-12-31T23:59:00+01:00');

            await dh.updateConsumption(0, '2022-01-01T00:00:00+01:00');
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo(0*1.43415 + 39/31, 0.00001);

            await dh.updateConsumption(1000, '2022-01-01T01:00:00+01:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(1000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(1);
            expect(device.getCapabilityValue('meter_power.year')).eq(1);
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo(1.43415 + 39/31, 0.00001);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_cost_month')).to.be.closeTo(1.43415 + 39/31, 0.00001);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).to.be.closeTo(1.43415 + 39/31, 0.00001);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(1000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(1.84645);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(1.43415 + 39/31 + 0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(1.43415 + 39/31 + 0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(1.43415 + 39/31 + 0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1000);

            await dh.updateConsumption(2000, '2022-01-01T23:00:00+01:00');
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo((1 + 2*22)*1.43415 + 39/31, 0.00001);

            await dh.updateConsumption(2000, '2022-01-01T23:59:59+01:00');
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo((1 + 2*23)*1.43415 + 39/31, 0.001);

            await dh.updateConsumption(2000, '2022-01-02T00:00:00+01:00');
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo(0*1.43415 + 39/31, 0.00001);
            expect(device.getCapabilityValue('meter_cost_month')).to.be.closeTo((1 + 2*23)*1.43415 + 2*39/31, 0.001);
            //expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(4*0.4123 + 2050/365, 0.00001);
            //expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo((1 + 2*23 + 2)*0.4123 + 2*2050/365, 0.00001); // TODO

            await dh.updateConsumption(2000, '2022-01-02T02:00:00+01:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(2000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(4);
            expect(device.getCapabilityValue('meter_power.year')).eq(51);
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo(4*1.43415 + 39/31, 0.00001);
            expect(device.getCapabilityValue('meter_cost_yesterday')).to.be.closeTo((1 + 2*23)*1.43415 + 39/31, 0.00001);
            expect(device.getCapabilityValue('meter_cost_month')).to.be.closeTo((1 + 2*23 + 4)*1.43415 + 2*39/31, 0.001);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).to.be.closeTo((1 + 2*23 + 4)*1.43415 + 2*39/31, 0.001);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(4*0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo((1 + 2*23)*0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo((1 + 2*23 + 4)*0.4123 + 2*2050/365, 0.001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo((1 + 2*23 + 4)*0.4123 + 2*2050/365, 0.001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq((1.43415 + 0.4123) * 2);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(4*1.43415 + 39/31 + 4*0.4123 + 2050/365, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo((1 + 2*23 + 4)*1.43415 + 2*39/31 + (1 + 2*23 + 4)*0.4123 + 2*2050/365, 0.01);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo((1 + 2*23 + 4)*1.43415 + 2*39/31 + (1 + 2*23 + 4)*0.4123 + 2*2050/365, 0.01);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(3999.444444, 0.00001);
        });
    });

});