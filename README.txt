The 'Norwegian Electricity Bill' is a device to calculate electricity and grid prices for Norway.

To install the device:

1. Add the 'Norwegian Electricity Bill' device.
2. Go to 'Advanced settings'.  If you have a spot plan or fixed price plan, edit the price formula.
3. Adjust the settings for grid capacity and grid energy for your grid provider.
4. Add a flow to update consumption from a pulse device, eg. Tibber Pulse.  WHEN: Power changed, THEN: Update consumption with <POWER>.
5. If the price comes from a price source, eg. Tibber, select 'From flow', and create the flow: WHEN: Price changed, THEN: Update price with <PRICE>.

For more information, click the Homey Community - link on this page.
