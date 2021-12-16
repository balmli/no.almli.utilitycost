'use strict';

const Homey = require('homey');

module.exports = class UtilityCostsDriver extends Homey.Driver {

  async onInit() {
    this.log('UtilityCostsDriver driver has been initialized');
  }

  async onPairListDevices() {
    return [
      {
        "name": this.homey.__('name'),
        "data": {
          "id": 'utility-cost'
        }
      }
    ];
  }

};
