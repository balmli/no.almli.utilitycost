import {expect} from 'chai';

import {DeviceHandler} from '../lib/DeviceHandler';
import {HomeyDevice} from './HomeyDevice';

describe('Update energy', function () {

    describe('Check updateEnergy', function () {
        it('Check updateEnergy 1', async function () {
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
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(207.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(207.5, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(207.5, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(2000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(4);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(212, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(212, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(212, 0.00001);
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
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(218, 0.00001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(218, 0.00001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0, 0.00001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(218, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(1000);
            expect(device.getCapabilityValue('meter_sum_current')).eq(2);
            expect(device.getCapabilityValue('meter_sum_day')).to.be.closeTo(254, 0.00001);
            expect(device.getCapabilityValue('meter_sum_month')).to.be.closeTo(254, 0.00001);
            expect(device.getCapabilityValue('meter_sum_year')).to.be.closeTo(254, 0.00001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(2000);
        });
    });

});