'use strict';

const Homey = require('homey');

module.exports = class UtilityCostsDriver extends Homey.Driver {

  async onInit() {
    this.log('UtilityCostsDriver driver has been initialized');
  }

  async onPairListDevices() {
    return [
      {
        "name": "Utility Costs",
        "data": {
          "id": 'utility-cost'
        }
      }
    ];
  }

};
