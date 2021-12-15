const http = require('http.min');
const moment = require('./moment-timezone-with-data');

const getHourlyPrices = async (aDate, opts) => {
  try {
    const data = await http.json({
        uri: 'https://www.nordpoolgroup.com/api/marketdata/page/10?' +
          'currency=,' + opts.currency + ',' + opts.currency + ',' + opts.currency +
          '&endDate=' + aDate.format('DD-MM-YYYY'),
        timeout: 30000
      }
    );
    return parseResult(data, opts);
  } catch (err) {
    throw err;
  }
};

const parseResult = (data, opts) => {
  const timeZone = moment().tz();
  const result = [];
  if (data.data && data.data.Rows && data.data.Rows.length) {
    for (var i = 0; i < data.data.Rows.length; i++) {
      const row = data.data.Rows[i];
      if (row.IsExtraRow) {
        continue;
      }

      const startsAt = moment.tz(row.StartTime, "YYYY-MM-DD\Thh:mm:ss", 'Europe/Oslo').tz(timeZone);
      const time = startsAt.unix();

      for (let j = 0; j < row.Columns.length; j++) {
        const column = row.Columns[j];
        const price = Math.round(100000 * (parseFloat(column.Value.replace(/,/, '.').replace(' ', '')) / 1000.0)) / 100000;

        if (isNaN(price)) {
          continue;
        }
        if (column.Name === opts.priceArea) {
          result.push({ startsAt, time, price });
        }
      }
    }
  }
  return result;
};

const fetchPrices = async (aDate, opts) => {
  try {
    const oslo = moment().tz('Europe/Oslo');
    const ops = [
      aDate.utcOffset() > oslo.utcOffset() ? getHourlyPrices(moment(aDate).add(-1, 'day'), opts) : undefined,
      getHourlyPrices(moment(aDate), opts),
      getHourlyPrices(moment(aDate).add(1, 'day'), opts)
    ];

    const result = await Promise.all(ops.filter(o => !!o));

    return result
      .filter(r => r && typeof r === 'object' && r.length > 0)
      .flatMap(r => r)
      .sort((a,b) => a.time - b.time);
  } catch (err) {
    this.error(err);
  }
};

module.exports = {
  fetchPrices
};
