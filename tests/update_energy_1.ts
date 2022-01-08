import {expect} from 'chai';

import {DeviceHandler} from '../lib/DeviceHandler';
import {HomeyDevice} from './HomeyDevice';

describe('Update energy', function () {

    describe('Check updateEnergy', function () {
        it('Check updateEnergy 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050,
                resetEnergyDaily: true
            });
            device.setCapabilityValue('meter_price_incl', 1.5);
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);

            await dh.updateEnergy(0, '2021-12-31T23:59:00+01:00');
            await dh.updateEnergy(0, '2022-01-01T00:00:00+01:00');
            await dh.updateEnergy(1, '2022-01-01T01:00:00+01:00');

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

            await dh.updateEnergy(3, '2022-01-01T02:00:00+01:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(2000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(3);
            expect(device.getCapabilityValue('meter_power.year')).eq(3);
            expect(device.getCapabilityValue('meter_cost_today')).eq(4.5);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_cost_month')).eq(4.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(4.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(7.116438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(7.116438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(7.116438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(11.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(11.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(11.616438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(2000);

            await dh.updateEnergy(24, '2022-01-01T23:00:00+01:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(1000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(24);
            expect(device.getCapabilityValue('meter_power.year')).eq(24);
            expect(device.getCapabilityValue('meter_cost_today')).eq(36);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_cost_month')).eq(36);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(36);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(17.616438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(17.616438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(17.616438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(1000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(2);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(53.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(53.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(53.616438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(2000);
        });
        it('Check updateEnergy 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050,
                resetEnergyDaily: true
            });
            device.setCapabilityValue('meter_price_incl', 1.5);
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);

            await dh.updateEnergy(0, '2021-12-31T23:59:00+01:00');
            await dh.updateEnergy(0, '2022-01-01T00:00:00+01:00');
            await dh.updateEnergy(15, '2022-01-02T00:00:00+01:00');

            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption')).eq(625);
            expect(device.getCapabilityValue('meter_power.acc')).eq(0);
            expect(device.getCapabilityValue('meter_power.year')).eq(15);
            expect(device.getCapabilityValue('meter_cost_today')).eq(0);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(22.5);
            expect(device.getCapabilityValue('meter_cost_month')).eq(0);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(0);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(5.616438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(13.116438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo( 11.232876, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo( 11.232876, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(625);
            expect(device.getCapabilityValue('meter_sum_current')).eq(1.25);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(5.616438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(11.232876, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(11.232876, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(625);
        });

        it('Check updateEnergy 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050,
                resetEnergyDaily: true
            });
            device.setCapabilityValue('meter_price_incl', 1.5);
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);

            await dh.updateEnergy(0, '2021-12-31T23:59:00+01:00');
            await dh.updateEnergy(0.000, '2022-01-01T00:00:00+01:00');
            await dh.updateEnergy(1.230, '2022-01-01T01:00:00+01:00');
            await dh.updateEnergy(3.450, '2022-01-01T02:00:00+01:00');
            await dh.updateEnergy(3.890, '2022-01-01T03:00:00+01:00');
            await dh.updateEnergy(4.560, '2022-01-01T04:00:00+01:00');
            await dh.updateEnergy(6.530, '2022-01-01T05:00:00+01:00');
            await dh.updateEnergy(7.677, '2022-01-01T06:00:00+01:00');
            await dh.updateEnergy(8.923, '2022-01-01T07:00:00+01:00');
            await dh.updateEnergy(10.210, '2022-01-01T08:00:00+01:00');
            await dh.updateEnergy(12.340, '2022-01-01T09:00:00+01:00');
            await dh.updateEnergy(14.110, '2022-01-01T10:00:00+01:00');
            await dh.updateEnergy(15.693, '2022-01-01T11:00:00+01:00');
            await dh.updateEnergy(18.933, '2022-01-01T12:00:00+01:00');
            await dh.updateEnergy(20.340, '2022-01-01T13:00:00+01:00');
            await dh.updateEnergy(23.440, '2022-01-01T14:00:00+01:00');
            await dh.updateEnergy(23.650, '2022-01-01T15:00:00+01:00');
            await dh.updateEnergy(26.230, '2022-01-01T16:00:00+01:00');
            await dh.updateEnergy(27.290, '2022-01-01T17:00:00+01:00');
            await dh.updateEnergy(29.900, '2022-01-01T18:00:00+01:00');
            await dh.updateEnergy(30.450, '2022-01-01T19:00:00+01:00');
            await dh.updateEnergy(34.570, '2022-01-01T20:00:00+01:00');
            await dh.updateEnergy(37.400, '2022-01-01T21:00:00+01:00');
            await dh.updateEnergy(39.230, '2022-01-01T22:00:00+01:00');
            await dh.updateEnergy(41.020, '2022-01-01T23:00:00+01:00');
            //console.log(device.getCapabilityValues());

            expect(device.getCapabilityValue('meter_consumption')).to.be.closeTo(1790, 0.00001);
            expect(device.getCapabilityValue('meter_power.acc')).eq(41.02);
            expect(device.getCapabilityValue('meter_power.year')).eq(41.02);
            expect(device.getCapabilityValue('meter_cost_today')).eq(61.53);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_cost_month')).eq(61.53);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(61.53);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(26.126438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo( 26.126438, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo( 26.126438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).to.be.closeTo(1790, 0.00001);
            expect(device.getCapabilityValue('meter_sum_current')).to.be.closeTo(3.58, 0.00001);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(87.656438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(87.656438, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(87.656438, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(4120, 0.00001);
        });
    });

});