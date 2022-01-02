import {expect} from 'chai';

import {HomeyDevice} from './HomeyDevice';

describe('HomeyDevice', function () {

    describe('Check constructor', function () {
        it('Check constructor 1', function () {
            const homeyDevice = new HomeyDevice();
        });
    });

    describe('Check getCapabilityValue', function () {
        it('Check getCapabilityValue 1', function () {
            const homeyDevice = new HomeyDevice();
            homeyDevice.setCapabilityValue('bob', 1);
            expect(homeyDevice.getCapabilityValue('bob')).eq(1);
        });
    });

    describe('Check getSetting', function () {
        it('Check getSetting 1', function () {
            const homeyDevice = new HomeyDevice();
            expect(homeyDevice.getSettings()).to.eql({});
            homeyDevice.setSettings({bob: 1});
            expect(homeyDevice.getSettings()).to.eql({bob: 1});
            expect(homeyDevice.getSetting('bob')).eq(1);
            homeyDevice.setSettings({bar: 'gogo'});
            expect(homeyDevice.getSettings()).to.eql({bob: 1, bar: 'gogo'});
            expect(homeyDevice.getSetting('bar')).eq('gogo');
        });
    });


});