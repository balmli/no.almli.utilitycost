module.exports = {
  // @ts-ignore
  async fetchPrices({ homey }) {
    return homey.app.getPrices();
  },
  // @ts-ignore
  async fetchGridCosts({ homey }) {
    return homey.app.getGridCosts();
  },
};
