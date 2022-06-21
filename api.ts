module.exports = {
  // @ts-ignore
  async fetchPrices({ homey }) {
    return homey.app.getPrices();
  },
};
