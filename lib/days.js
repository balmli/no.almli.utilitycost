'use strict';

const moment = require('./moment-timezone-with-data');

const setTimeZone = (tz) => {
  moment.tz.setDefault(tz);
};

module.exports = {
  setTimeZone
};
