'use strict';

const moment = require('./moment-timezone-with-data');

const toHour = (aDate) => {
  return moment(aDate).startOf('hour').toISOString();
}

const currentPrice = (prices, aDate) => {
  const currentHour = toHour(aDate);
  return prices.find(p => toHour(p.startsAt) === currentHour);
};

module.exports = {
  toHour,
  currentPrice,
};

