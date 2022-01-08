import {expect} from 'chai';

import {DeviceHandler} from '../lib/DeviceHandler';
import {HomeyDevice} from './HomeyDevice';

const getSettings = () => {
    return {
        gridNewRegime: true,
        gridEnergyDay: 0.3489,
        gridEnergyNight: 0.2489,
        gridEnergyDaySummer: 0.4301,
        gridEnergyNightSummer: 0.3301,
        gridEnergyWinterStart: '0',
        gridEnergySummerStart: '3',
        gridEnergyLowWeekends: true
    };
};

describe('Devices', function () {

    describe('Check constructor', function () {
        it('Check constructor 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
        });
    });

    describe('Check evaluatePrice', function () {
        it('Check evaluatePrice 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluatePrice('1+2');
            expect(response).eq(3);
        });
        it('Check evaluatePrice 2', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluatePrice('PRICE_NORDPOOL * 1.25 + 0.0299', 1.23);
            expect(response).to.be.closeTo(1.5674, 0.0001);
        });
        it('Check evaluatePrice - fails', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            try {
                const response = dh.evaluatePrice('XXX * 1.25 + 0.0299', 1.23);
            } catch (err: any) {
                expect(err.message).eq('Wrong character for function at position 3');
            }
        });
        it('Check evaluatePrice - a function', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluatePrice('min(1,2)');
            expect(response).eq(1);
        });
        it('Check evaluatePrice - monthly hours - 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluatePrice('PRICE_NORDPOOL * 1.25 + 0.0299 + 39/MONTHLY_HOURS', 1.23, '2022-01-01T00:01:00.000+01:00');
            expect(response).to.be.closeTo(1.61982, 0.0001);
        });
        it('Check evaluatePrice - monthly hours - 2', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluatePrice('PRICE_NORDPOOL * 1.25 + 0.0299 + 39/MONTHLY_HOURS', 1.23, '2022-02-05T00:01:00.000+01:00');
            expect(response).to.be.closeTo(1.62544, 0.0001);
        });
    });

    describe('Check validateCostFormula', function () {
        it('Check validateCostFormula 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.validateCostFormula('1+2');
            expect(response).eq(true);
        });
        it('Check validateCostFormula 2', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.validateCostFormula('PRICE_NORDPOOL * 1.25 + 0.0299');
            expect(response).eq(true);
        });
        it('Check validateCostFormula 3', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            try {
                dh.validateCostFormula('xxx * 1.25 + 0.0299');
            } catch (err: any) {
                expect(err.message).eq('errors.invalid_cost_formula_msg');
            }
        });
    });

    describe('Check evaluateFixedAmount', function () {
        it('Check evaluateFixedAmount 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluateFixedAmount('1+2');
            expect(response).eq(3);
        });
        it('Check evaluateFixedAmount - fails', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            try {
                const response = dh.evaluateFixedAmount('XXX * 1.25 + 0.0299', 1.23);
            } catch (err: any) {
                expect(err.message).eq('Wrong character for function at position 3');
            }
        });
        it('Check evaluateFixedAmount - a function', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluateFixedAmount('min(1,2)');
            expect(response).eq(1);
        });
        it('Check evaluateFixedAmount - monthly hours - 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluateFixedAmount('0.02 * MONTHLY_HOURS', '2022-01-01T00:01:00.000+01:00');
            expect(response).to.be.closeTo(14.88, 0.0001);
        });
        it('Check evaluateFixedAmount - monthly hours - 2', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.evaluateFixedAmount('0.02 * MONTHLY_HOURS',  '2022-02-05T00:01:00.000+01:00');
            expect(response).to.be.closeTo(13.44, 0.0001);
        });
    });

    describe('Check validateCostFormulaFixedAmount', function () {
        it('Check validateCostFormulaFixedAmount 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.validateCostFormulaFixedAmount('1+2');
            expect(response).eq(true);
        });
        it('Check validateCostFormulaFixedAmount 2', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.validateCostFormulaFixedAmount('MONTHLY_HOURS * 2.05');
            expect(response).eq(true);
        });
        it('Check validateCostFormulaFixedAmount 3', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            try {
                dh.validateCostFormulaFixedAmount('xxx * 1.25 + 0.0299');
            } catch (err: any) {
                expect(err.message).eq('errors.invalid_cost_formula_fixed_amount_msg');
            }
        });
    });

    describe('Check roundPrice', function () {
        it('Check roundPrice 1', function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const response = dh.roundPrice(1.234567890123);
            expect(response).eq(1.23457);
        });
    });

    describe('Check spotPriceCalculation', function () {
        it('Check spotPriceCalculation 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({costFormula: 'PRICE_NORDPOOL * 1.25 + 0.0299'});
            const dh = new DeviceHandler(device);
            await dh.spotPriceCalculation(1.23);
            expect(device.getCapabilityValue('meter_price_excl')).eq(1.23);
            expect(device.getCapabilityValue('meter_price_incl')).eq(1.5674);
            expect(device.getCapabilityValue('meter_price_sum')).eq(1.5674);
        });
        it('Check spotPriceCalculation 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({costFormula: 'min(PRICE_NORDPOOL, 0.89) + 0.0299'});
            const dh = new DeviceHandler(device);
            await dh.spotPriceCalculation(1.23);
            expect(device.getCapabilityValue('meter_price_excl')).eq(1.23);
            expect(device.getCapabilityValue('meter_price_incl')).eq(0.9199);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.9199);
        });
    });

    describe('Check fixedPriceCalculation', function () {
        it('Check fixedPriceCalculation 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({costFormula: '0.89'});
            const dh = new DeviceHandler(device);
            await dh.fixedPriceCalculation();
            expect(device.getCapabilityValue('meter_price_excl')).eq(0.712);
            expect(device.getCapabilityValue('meter_price_incl')).eq(0.89);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.89);
        });
    });

    describe('Check fixedPriceCalculation', function () {
        it('Check gridPriceCalculation 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridConsumption: 0.4012
            });
            const dh = new DeviceHandler(device);
            await dh.gridPriceCalculation('2022-01-01T10:00:00.000Z');
            expect(device.getCapabilityValue('meter_gridprice_incl')).eq(0.4012);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.4012);
        });
        it('Check gridPriceCalculation 2', async function () {
            const device = new HomeyDevice();
            device.setSettings(getSettings());
            const dh = new DeviceHandler(device);
            await dh.gridPriceCalculation('2022-01-01T10:00:00.000Z');
            expect(device.getCapabilityValue('meter_gridprice_incl')).eq(0.2489);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.2489);
        });
        it('Check gridPriceCalculation 3', async function () {
            const device = new HomeyDevice();
            device.setSettings(getSettings());
            const dh = new DeviceHandler(device);
            await dh.gridPriceCalculation('2022-01-03T10:00:00.000Z');
            expect(device.getCapabilityValue('meter_gridprice_incl')).eq(0.3489);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.3489);
        });
        it('Check gridPriceCalculation 4', async function () {
            const device = new HomeyDevice();
            device.setSettings(getSettings());
            const dh = new DeviceHandler(device);
            await dh.gridPriceCalculation('2022-04-01T10:00:00.000Z');
            expect(device.getCapabilityValue('meter_gridprice_incl')).eq(0.4301);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.4301);
        });
        it('Check gridPriceCalculation 5', async function () {
            const device = new HomeyDevice();
            device.setSettings(getSettings());
            const dh = new DeviceHandler(device);
            await dh.gridPriceCalculation('2022-04-01T00:00:00.000Z');
            expect(device.getCapabilityValue('meter_gridprice_incl')).eq(0.3301);
            expect(device.getCapabilityValue('meter_price_sum')).eq(0.3301);
        });
    });

    describe('Check updatePrice', function () {
        it('Check updatePrice 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({priceCalcMethod: 'nordpool_spot'});
            const dh = new DeviceHandler(device);
            await dh.updatePrice(1.23);
            expect(device.getSetting('priceCalcMethod')).eq('flow');
            expect(device.getCapabilityValue('meter_price_excl')).eq(0.984);
            expect(device.getCapabilityValue('meter_price_incl')).eq(1.23);
            expect(device.getCapabilityValue('meter_price_sum')).eq(1.23);
        });
    });

    describe('Check startOfValues', function () {
        it('Check startOfValues 1', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2022-04-01T00:00:00.000Z');
            //console.log(sv);
            expect(sv.thisUpdate).eq(1648771200000);
            expect(sv.lastUpdate).eq(undefined);
            expect(sv.startOfHour).eq(1648771200000);
            expect(sv.startOfDay).eq(1648764000000);
            expect(sv.startOfMonth).eq(1648764000000);
            expect(sv.startOfYear).eq(1640991600000);
            expect(sv.newHour).eq(false);
            expect(sv.newDay).eq(false);
            expect(sv.newMonth).eq(false);
            expect(sv.newYear).eq(false);
        });
        it('Check startOfValues 2', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000Z');
            expect(sv1.thisUpdate).eq(1648771200000);
            expect(sv1.lastUpdate).eq(undefined);
            expect(sv1.startOfHour).eq(1648771200000);
            expect(sv1.startOfDay).eq(1648764000000);
            expect(sv1.startOfMonth).eq(1648764000000);
            expect(sv1.startOfYear).eq(1640991600000);
            expect(sv1.newHour).eq(false);
            expect(sv1.newDay).eq(false);
            expect(sv1.newMonth).eq(false);
            expect(sv1.newYear).eq(false);

            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000Z');
            //console.log(sv2);
            expect(sv2.thisUpdate).eq(1648771200000 + 60000);
            expect(sv2.lastUpdate).eq(1648771200000);
            expect(sv2.startOfHour).eq(1648771200000);
            expect(sv2.startOfDay).eq(1648764000000);
            expect(sv2.startOfMonth).eq(1648764000000);
            expect(sv2.startOfYear).eq(1640991600000);
            expect(sv2.newHour).eq(false);
            expect(sv2.newDay).eq(false);
            expect(sv2.newMonth).eq(false);
            expect(sv2.newYear).eq(false);
        });
        it('Check startOfValues 3', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2021-12-31T23:59:00.000+01:00');
            //console.log(sv1);
            expect(sv1.thisUpdate).eq(1640991540000);
            expect(sv1.lastUpdate).eq(undefined);
            expect(sv1.startOfHour).eq(1640988000000);
            expect(sv1.startOfDay).eq(1640905200000);
            expect(sv1.startOfMonth).eq(1638313200000);
            expect(sv1.startOfYear).eq(1609455600000);
            expect(sv1.newHour).eq(false);
            expect(sv1.newDay).eq(false);
            expect(sv1.newMonth).eq(false);
            expect(sv1.newYear).eq(false);

            const sv2 = await dh.startOfValues('2022-01-01T00:01:00.000+01:00');
            //console.log(sv2);
            expect(sv2.thisUpdate).eq(1640991540000 + 120 * 1000);
            expect(sv2.lastUpdate).eq(1640991540000);
            expect(sv2.startOfHour).eq(1640988000000 + 3600 * 1000);
            expect(sv2.startOfDay).eq(1640905200000 + 24 * 3600 * 1000);
            expect(sv2.startOfMonth).eq(1638313200000 + 31 * 24 * 3600 * 1000);
            expect(sv2.startOfYear).eq(1609455600000 + 365 * 24 * 3600 * 1000);
            expect(sv2.newHour).eq(true);
            expect(sv2.newDay).eq(true);
            expect(sv2.newMonth).eq(true);
            expect(sv2.newYear).eq(true);
        });
        it('Check startOfValues 4', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2021-12-31T23:59:00+01:00');
            expect(sv1.now.format()).eq('2021-12-31T23:59:00+01:00');
        });
    });

    describe('Check calculateEnergy', function () {
        it('Check calculateEnergy 1', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T01:01:06.000+01:00');
            await dh.calculateEnergy(1000, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_power.acc')).to.be.closeTo(1.018333, 0.000001);
            expect(device.getCapabilityValue('meter_power.year')).to.be.closeTo(1.018333, 0.000001);
        });
        it('Check calculateEnergy 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                resetEnergyDaily: true
            })
            const dh = new DeviceHandler(device);
            const sv0 = await dh.startOfValues('2021-12-31T23:00:00.000+01:00');
            const sv1 = await dh.startOfValues('2022-01-01T00:00:00.000+01:00');
            await dh.calculateEnergy(1234, sv1);
            //console.log(sv1, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_power.acc')).to.be.closeTo(0, 0.000001);
            expect(device.getCapabilityValue('meter_power.year')).to.be.closeTo(0, 0.000001);
            const sv2 = await dh.startOfValues('2022-01-01T01:01:06.000+01:00');
            await dh.calculateEnergy(3456, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_power.acc')).to.be.closeTo(3.51936, 0.000001);
            expect(device.getCapabilityValue('meter_power.year')).to.be.closeTo(3.51936, 0.000001);
        });
        it('Check calculateEnergy 3 ', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                resetEnergyDaily: false
            })
            const dh = new DeviceHandler(device);
            const sv0 = await dh.startOfValues('2021-12-31T23:00:00.000+01:00');
            const sv1 = await dh.startOfValues('2022-01-01T00:00:00.000+01:00');
            await dh.calculateEnergy(1234, sv1);
            //console.log(sv1, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_power.acc')).to.be.closeTo(1.234, 0.000001);
            expect(device.getCapabilityValue('meter_power.year')).to.be.closeTo(0, 0.000001);
            const sv2 = await dh.startOfValues('2022-01-01T01:01:06.000+01:00');
            await dh.calculateEnergy(3456, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_power.acc')).to.be.closeTo(4.75336, 0.000001);
            expect(device.getCapabilityValue('meter_power.year')).to.be.closeTo(3.51936, 0.000001);
        });
    });

    describe('Check calculateUtilityCost', function () {
        it('Check calculateUtilityCost 1', async function () {
            const device = new HomeyDevice();
            device.setCapabilityValue('meter_price_incl', 1.5);
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000+01:00');
            await dh.calculateUtilityCost(1000, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_cost_today')).eq(0.025);
            expect(device.getCapabilityValue('meter_cost_month')).eq(0.025);
            expect(device.getCapabilityValue('meter_cost_year')).eq(0.025);
        });
        it('Check calculateUtilityCost 2', async function () {
            const device = new HomeyDevice();
            device.setCapabilityValue('meter_price_incl', 1.5);
            const dh = new DeviceHandler(device);
            const sv0 = await dh.startOfValues('2022-04-01T23:59:00.000+01:00');
            const sv1 = await dh.startOfValues('2022-04-01T23:59:30.000+01:00');
            await dh.calculateUtilityCost(1000, sv1);
            const sv2 = await dh.startOfValues('2022-04-02T00:00:30.000+01:00');
            await dh.calculateUtilityCost(1000, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo(0.0375, 0.00001);
            expect(device.getCapabilityValue('meter_cost_month')).to.be.closeTo(0.0375, 0.00001);
            expect(device.getCapabilityValue('meter_cost_year')).to.be.closeTo(0.0375, 0.00001);
        });
        it('Check calculateUtilityCost 3', async function () {
            const device = new HomeyDevice();
            device.setCapabilityValue('meter_price_incl', 1.5);
            const dh = new DeviceHandler(device);
            const sv0 = await dh.startOfValues('2021-12-31T23:58:00.000+01:00');
            const sv1 = await dh.startOfValues('2021-12-31T23:59:00.000+01:00');
            await dh.calculateUtilityCost(1000, sv1);
            const sv2 = await dh.startOfValues('2022-01-01T00:00:00.000+01:00');
            await dh.calculateUtilityCost(1000, sv2);
            const sv3 = await dh.startOfValues('2022-01-01T00:01:00.000+01:00');
            await dh.calculateUtilityCost(1000, sv3);
            //console.log(sv3, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_cost_today')).to.be.closeTo(0.025, 0.00001);
            expect(device.getCapabilityValue('meter_cost_yesterday')).to.be.closeTo(0.05, 0.00001);
            expect(device.getCapabilityValue('meter_cost_month')).to.be.closeTo(0.025, 0.00001);
            expect(device.getCapabilityValue('meter_cost_lastmonth')).to.be.closeTo(0.05, 0.00001);
            expect(device.getCapabilityValue('meter_cost_year')).to.be.closeTo(0.025, 0.00001);
        });
    });

    describe('Check calculateGridCost', function () {
        it('Check calculateGridCost 1', async function () {
            const device = new HomeyDevice();
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000+01:00');
            await dh.calculateGridCost(1000, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0.008333, 0.000001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.008333, 0.000001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.008333, 0.000001);
        });
        it('Check calculateGridCost 2', async function () {
            const device = new HomeyDevice();
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);
            const sv0 = await dh.startOfValues('2022-04-01T23:59:00.000+01:00');
            const sv1 = await dh.startOfValues('2022-04-01T23:59:30.000+01:00');
            await dh.calculateGridCost(1000, sv1);
            const sv2 = await dh.startOfValues('2022-04-02T00:00:30.000+01:00');
            await dh.calculateGridCost(1000, sv2);
            //console.log(sv2, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0.0125, 0.000001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.0125, 0.000001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.0125, 0.000001);
        });
        it('Check calculateGridCost 3', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050
            });
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device);
            const sv0 = await dh.startOfValues('2021-12-31T23:58:00.000+01:00');
            const sv1 = await dh.startOfValues('2021-12-31T23:59:00.000+01:00');
            await dh.calculateGridCost(1000, sv1);
            const sv2 = await dh.startOfValues('2022-01-01T00:00:00.000+01:00');
            await dh.calculateGridCost(1000, sv2);
            const sv3 = await dh.startOfValues('2022-01-01T00:01:00.000+01:00');
            await dh.calculateGridCost(1000, sv3);
            //console.log(sv3, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(5.624771, 0.000001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0.016666, 0.000001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(5.624771, 0.000001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0.016666, 0.000001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(5.624771, 0.000001);
        });
        it('Check calculateGridCost 4', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050
            });
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            const dh = new DeviceHandler(device, {
                addCapabilityCosts: false
            });
            const sv0 = await dh.startOfValues('2021-12-31T23:58:00.000+01:00');
            const sv1 = await dh.startOfValues('2021-12-31T23:59:00.000+01:00');
            await dh.calculateGridCost(1000, sv1);
            const sv2 = await dh.startOfValues('2022-01-01T00:00:00.000+01:00');
            await dh.calculateGridCost(1000, sv2);
            const sv3 = await dh.startOfValues('2022-01-01T00:01:00.000+01:00');
            await dh.calculateGridCost(1000, sv3);
            //console.log(sv3, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_grid_today')).to.be.closeTo(0.008333, 0.000001);
            expect(device.getCapabilityValue('meter_grid_yesterday')).to.be.closeTo(0.016666, 0.000001);
            expect(device.getCapabilityValue('meter_grid_month')).to.be.closeTo(0.008333, 0.000001);
            expect(device.getCapabilityValue('meter_grid_lastmonth')).to.be.closeTo(0.016666, 0.000001);
            expect(device.getCapabilityValue('meter_grid_year')).to.be.closeTo(0.008333, 0.000001);
        });
    });

    describe('Check calculateConsumptionHour', function () {
        it('Check calculateConsumptionHour 1', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000+01:00');
            const response = await dh.calculateConsumptionHour(1000, sv2);
            //console.log(sv2, response, device.getCapabilityValues());
            expect(response.newConsumptionWh).to.be.closeTo(16.666666, 0.000001);
            expect(response.sumConsumptionMaxHour).to.be.closeTo(0, 0.000001);
            expect(response.newConsumptionMaxMonthWh).to.be.closeTo(16.666666, 0.000001);
        });
        it('Check calculateConsumptionHour 2', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T01:00:00.000+01:00');
            const response = await dh.calculateConsumptionHour(1000, sv2);
            //console.log(sv2, response, device.getCapabilityValues());
            expect(response.newConsumptionWh).to.be.closeTo(1000, 0.000001);
            expect(response.sumConsumptionMaxHour).to.be.closeTo(0, 0.000001);
            expect(response.newConsumptionMaxMonthWh).to.be.closeTo(1000, 0.000001);
        });
        it('Check calculateConsumptionHour 3', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T00:30:00.000+01:00');
            const response = await dh.calculateConsumptionHour(1000, sv2);
            //console.log(sv2, response, device.getCapabilityValues());
            expect(response.newConsumptionWh).to.be.closeTo(500, 0.000001);
            expect(response.sumConsumptionMaxHour).to.be.closeTo(0, 0.000001);
            expect(response.newConsumptionMaxMonthWh).to.be.closeTo(500, 0.000001);
        });
        it('Check calculateConsumptionHour 4', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-02T00:00:00.000+01:00');
            const response = await dh.calculateConsumptionHour(1000, sv2);
            //console.log(sv2, response, device.getCapabilityValues());
            expect(response.newConsumptionWh).to.be.closeTo(1000, 0.000001);
            expect(response.sumConsumptionMaxHour).to.be.closeTo(0, 0.000001);
            expect(response.newConsumptionMaxMonthWh).to.be.closeTo(1000, 0.000001);
        });
    });

    describe('Check calculateMaxConsumptionHour', function () {
        it('Check calculateMaxConsumptionHour 1', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000+01:00');
            await dh.calculateMaxConsumptionHour(1000, sv2);
            const sv3 = await dh.startOfValues('2022-04-01T01:00:00.000+01:00');
            await dh.calculateMaxConsumptionHour(12000, sv3);
            //console.log(sv3, device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_consumption_hour')).to.be.closeTo(11800, 0.000001);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).to.be.closeTo(11800, 0.000001);
        });
    });

    describe('Check calculateSumCost', function () {
        it('Check calculateSumCost 1', async function () {
            const device = new HomeyDevice();
            device.setCapabilityValue('meter_price_incl', 1.23);
            device.setCapabilityValue('meter_gridprice_incl', 0.5);
            device.setCapabilityValue('meter_cost_today', 100);
            device.setCapabilityValue('meter_cost_month', 200);
            device.setCapabilityValue('meter_cost_year', 300);
            device.setCapabilityValue('meter_grid_today', 50);
            device.setCapabilityValue('meter_grid_month', 60);
            device.setCapabilityValue('meter_grid_year', 70);

            const dh = new DeviceHandler(device);
            await dh.calculateSumCost(2345);

            //console.log(device.getCapabilityValues());
            expect(device.getCapabilityValue('meter_sum_current')).to.be.closeTo(4.05685, 0.000001);
            expect(device.getCapabilityValue('meter_sum_day')).eq(150);
            expect(device.getCapabilityValue('meter_sum_month')).eq(260);
            expect(device.getCapabilityValue('meter_sum_year')).eq(370);
        });
    });

    describe('Check getUtilityFixedAmountPerDay', function () {
        it('Check getUtilityFixedAmountPerDay 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                costFormulaFixedAmount: '39'
            });
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2022-04-01T00:00:00+01:00');

            expect(dh.getUtilityFixedAmountPerDay(sv)).to.be.closeTo(1.3, 0.000001);
        });
        it('Check getUtilityFixedAmountPerDay 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                costFormulaFixedAmount: '0.02 * MONTHLY_HOURS'
            });
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2022-04-01T00:00:00+01:00');

            expect(dh.getUtilityFixedAmountPerDay(sv)).to.be.closeTo(0.48, 0.000001);
        });
    });

    describe('Check getGridFixedAmountPerDay', function () {
        it('Check getGridFixedAmountPerDay 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 2050
            });
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');

            expect(dh.getGridFixedAmountPerDay(sv)).to.be.closeTo(5.616438, 0.000001);
        });
        it('Check getGridFixedAmountPerDay 2', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 3650
            });
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            expect(dh.getGridFixedAmountPerDay(sv)).eq(10);
        });
        it('Check getGridFixedAmountPerDay 3', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 3660
            });
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2024-04-01T00:00:00.000+01:00');
            expect(dh.getGridFixedAmountPerDay(sv)).eq(10);
        });
        it('Check getGridFixedAmountPerDay 4', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: true,
                gridFixedAmount: 3660
            });
            const dh = new DeviceHandler(device);
            const sv = await dh.startOfValues('2024-04-01T00:00:00.000+01:00');
            expect(dh.getGridFixedAmountPerDay(sv)).eq(0);
        });
        it('Check getGridFixedAmountPerDay 5', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 3660
            });
            const dh = new DeviceHandler(device, {
                addCapabilityCosts: false
            });
            const sv = await dh.startOfValues('2024-04-01T00:00:00.000+01:00');
            expect(dh.getGridFixedAmountPerDay(sv)).eq(0);
        });
        it('Check getGridFixedAmountPerDay 6', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: false,
                gridFixedAmount: 3660
            });
            const dh = new DeviceHandler(device);
            dh.setOptions({
                addCapabilityCosts: false
            })
            const sv = await dh.startOfValues('2024-04-01T00:00:00.000+01:00');
            expect(dh.getGridFixedAmountPerDay(sv)).eq(0);
        });
    });

    describe('Check getGridCapacityAddedCost', function () {
        it('Check getGridCapacityAddedCost 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: true,
                gridCapacity0_2: 100,
                gridCapacity2_5: 200,
                gridCapacity5_10: 300,
                gridCapacity10_15: 400,
                gridCapacity15_20: 500,
                gridCapacity20_25: 600,
            });
            const dh = new DeviceHandler(device);
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const cost1 = dh.getGridCapacityAddedCost(12000, sv1);
            await dh.calculateMaxConsumptionHour(12000, sv1);
            expect(cost1).eq(0);

            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000+01:00');
            const cost2 = dh.getGridCapacityAddedCost(12000, sv2);
            await dh.calculateMaxConsumptionHour(12000, sv2);
            expect(cost2).eq(0);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(200);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(200);

            const sv3 = await dh.startOfValues('2022-04-01T01:00:00.000+01:00');
            const cost3 = dh.getGridCapacityAddedCost(12000, sv3);
            await dh.calculateMaxConsumptionHour(12000, sv3);
            expect(cost3).eq(300);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(11800);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(11800);
        });
        it('Check getGridCapacityAddedCost 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridNewRegime: true,
                gridCapacity0_2: 100,
                gridCapacity2_5: 200,
                gridCapacity5_10: 300,
                gridCapacity10_15: 400,
                gridCapacity15_20: 500,
                gridCapacity20_25: 600,
            });
            const dh = new DeviceHandler(device);
            dh.setOptions({
                addCapabilityCosts: false
            })
            const sv1 = await dh.startOfValues('2022-04-01T00:00:00.000+01:00');
            const cost1 = dh.getGridCapacityAddedCost(12000, sv1);
            await dh.calculateMaxConsumptionHour(12000, sv1);
            expect(cost1).eq(0);

            const sv2 = await dh.startOfValues('2022-04-01T00:01:00.000+01:00');
            const cost2 = dh.getGridCapacityAddedCost(12000, sv2);
            await dh.calculateMaxConsumptionHour(12000, sv2);
            expect(cost2).eq(0);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(200);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(200);

            const sv3 = await dh.startOfValues('2022-04-01T01:00:00.000+01:00');
            const cost3 = dh.getGridCapacityAddedCost(12000, sv3);
            await dh.calculateMaxConsumptionHour(12000, sv3);
            expect(cost3).eq(0);
            expect(device.getCapabilityValue('meter_consumption_hour')).eq(11800);
            expect(device.getCapabilityValue('meter_consumption_maxmonth')).eq(11800);
        });
    });

    describe('Check getGridCapacity', function () {
        it('Check getGridCapacity 1', async function () {
            const device = new HomeyDevice();
            device.setSettings({
                gridCapacity0_2: 100,
                gridCapacity2_5: 200,
                gridCapacity5_10: 300,
                gridCapacity10_15: 400,
                gridCapacity15_20: 500,
                gridCapacity20_25: 600,
            });
            const dh = new DeviceHandler(device);
            expect(dh.getGridCapacity(0)).eq(100);
            expect(dh.getGridCapacity(1999)).eq(100);
            expect(dh.getGridCapacity(2000)).eq(200);
            expect(dh.getGridCapacity(4999)).eq(200);
            expect(dh.getGridCapacity(5000)).eq(300);
            expect(dh.getGridCapacity(9999)).eq(300);
            expect(dh.getGridCapacity(10000)).eq(400);
            expect(dh.getGridCapacity(14999)).eq(400);
            expect(dh.getGridCapacity(15000)).eq(500);
            expect(dh.getGridCapacity(19999)).eq(500);
            expect(dh.getGridCapacity(20000)).eq(600);
            expect(dh.getGridCapacity(40000)).eq(600);
            expect(dh.getGridCapacity(100000)).eq(600);
        });
    });

    describe('Check getGridCapacityLevel', function () {
        it('Check getGridCapacityLevel 1', async function () {
            const device = new HomeyDevice();
            const dh = new DeviceHandler(device);
            expect(dh.getGridCapacityLevel(0)).eq(0);
            expect(dh.getGridCapacityLevel(1999)).eq(0);
            expect(dh.getGridCapacityLevel(2000)).eq(1);
            expect(dh.getGridCapacityLevel(4999)).eq(1);
            expect(dh.getGridCapacityLevel(5000)).eq(2);
            expect(dh.getGridCapacityLevel(9999)).eq(2);
            expect(dh.getGridCapacityLevel(10000)).eq(3);
            expect(dh.getGridCapacityLevel(14999)).eq(3);
            expect(dh.getGridCapacityLevel(15000)).eq(4);
            expect(dh.getGridCapacityLevel(19999)).eq(4);
            expect(dh.getGridCapacityLevel(20000)).eq(5);
            expect(dh.getGridCapacityLevel(40000)).eq(5);
            expect(dh.getGridCapacityLevel(100000)).eq(5);
        });
    });
});