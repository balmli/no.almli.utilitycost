import {expect} from 'chai';

import {DeviceHandler} from '../lib/DeviceHandler';
import {HomeyDevice} from './HomeyDevice';

describe('Update consumption', function () {

    describe('Check updateConsumption', function () {
        it('Check updateConsumption 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridCapacity0_2: 125,
                gridCapacity2_5: 206,
                gridCapacity5_10: 350,
                gridCapacity10_15: 494,
                gridCapacity15_20: 638,
                gridCapacity20_25: 781,
                gridCapacityAverage: "3",
                gridEnergyDay: 0.499,
                gridEnergyNight: 0.399,
                gridEnergyLowWeekends: true,
                gridEnergyLowHoliday: false,
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
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(125.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(125.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(125.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(1000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(2);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(127, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(127, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(127, 0.00001);
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
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(148.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(125.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(125.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(127, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(127, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1500);

            await dh.updateConsumption(2500, '2022-01-03T00:00:00.000+01:00');
            await dh.updateConsumption(5000, '2022-01-04T00:00:00.000+01:00');
            //device.enableLogging(true);
            await dh.updateConsumption(5000, '2022-01-05T00:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            /*
            expect(device.getCapabilityValue('meter_consumption')).eq(5000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(0);
            expect(device.getCapabilityValue('meter_power.year')).eq(47);
            expect(device.getCapabilityValue('meter_cost_today')).eq(0);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(70.5);
            expect(device.getCapabilityValue('meter_cost_month')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(1.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(23.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1500);
            */

            await dh.updateConsumption(5000, '2022-01-06T00:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            /*
            expect(device.getCapabilityValue('meter_consumption')).eq(5000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(0);
            expect(device.getCapabilityValue('meter_power.year')).eq(47);
            expect(device.getCapabilityValue('meter_cost_today')).eq(0);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(70.5);
            expect(device.getCapabilityValue('meter_cost_month')).eq(1.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(1.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(23.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(2, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1500);
             */

            await dh.updateConsumption(15000, '2022-01-07T00:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            await dh.updateConsumption(15000, '2022-01-08T00:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            await dh.updateConsumption(15000, '2022-01-09T00:00:00.000+01:00');
            //console.log(device.getCapabilityValues());
            await dh.updateConsumption(15000, '2022-01-09T12:00:00.000+01:00');
            //console.log(device.getCapabilityValues());

            expect(device.getCapabilityValue('meter_consumption')).eq(15000);
            expect(device.getCapabilityValue('meter_power.acc')).eq(180);
            expect(device.getCapabilityValue('meter_power.year')).eq(1727);
            expect(device.getCapabilityValue('meter_cost_today')).eq(270);
            expect(device.getCapabilityValue('meter_cost_yesterday')).eq(540);
            expect(device.getCapabilityValue('meter_cost_month')).eq(271.5);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).eq(0);
            expect(device.getCapabilityValue('meter_cost_year')).eq(271.5);
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(234, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(324, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(728.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(728.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(15000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(30);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(504, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(1000, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(1000, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(15000);

        });
    });

    describe('Check updateConsumption', function () {
        it('Check updateConsumption 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridCapacity0_2: 100,
                gridCapacity2_5: 210,
                gridCapacity5_10: 330,
                gridCapacity10_15: 460,
                gridCapacity15_20: 600,
                gridCapacity20_25: 750,
                gridCapacityAverage: "3",
                gridEnergyDay: 0.5,
                gridEnergyNight: 0.3,
                gridEnergyLowWeekends: true,
                gridEnergyLowHoliday: false,
                resetEnergyDaily: true
            });
            device.setCapabilityValue('meter_price_incl', 0);
            device.setCapabilityValue('meter_gridprice_incl', 1);
            const dh = new DeviceHandler(device);

            await dh.updateConsumption(0, '2022-06-30T23:59:59.000+02:00');
            //await dh.updateConsumption(0, '2022-07-01T00:00:00.000+02:00');

            await dh.updateConsumption(0, '2022-07-01T00:00:00.000+02:00');
            await dh.updateConsumption(1000, '2022-07-01T00:00:00.001+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(100, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(100, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(0.000277, 0.00001);

            await dh.updateConsumption(1000, '2022-07-01T12:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(112);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(0);
            expect(device.getCapabilityValue('meter_grid_month')).eq(112);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1000);

            await dh.updateConsumption(2000, '2022-07-02T00:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(0);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(136);
            expect(device.getCapabilityValue('meter_grid_month')).eq(112);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1500);

            await dh.updateConsumption(2000, '2022-07-02T12:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(24);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(136);
            expect(device.getCapabilityValue('meter_grid_month')).eq(136);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(1500);

            await dh.updateConsumption(6000, '2022-07-03T00:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(110);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(96);
            expect(device.getCapabilityValue('meter_grid_month')).eq(246);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(3000);

            await dh.updateConsumption(6000, '2022-07-03T12:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(182);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(96);
            expect(device.getCapabilityValue('meter_grid_month')).eq(318);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(3000);

            await dh.updateConsumption(9000, '2022-07-04T00:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(120);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(290);
            expect(device.getCapabilityValue('meter_grid_month')).eq(438);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(5666.66666, 0.00001);

            await dh.updateConsumption(9000, '2022-07-04T12:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(228);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(290);
            expect(device.getCapabilityValue('meter_grid_month')).eq(546);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(5666.66666, 0.00001);

            await dh.updateConsumption(9000, '2022-07-05T00:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(0);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(336);
            expect(device.getCapabilityValue('meter_grid_month')).eq(546);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(8000, 0.00001);

            await dh.updateConsumption(9000, '2022-07-05T12:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(108);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(336);
            expect(device.getCapabilityValue('meter_grid_month')).eq(654);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(8000, 0.00001);

            await dh.updateConsumption(9000, '2022-07-06T00:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(0);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(216);
            expect(device.getCapabilityValue('meter_grid_month')).eq(654);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(9000, 0.00001);

            await dh.updateConsumption(9000, '2022-07-06T12:00:00.000+02:00');
            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).eq(108);
            expect(device.getCapabilityValue('meter_grid_yesterday')).eq(216);
            expect(device.getCapabilityValue('meter_grid_month')).eq(762);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(9000, 0.00001);
        });
    });

});