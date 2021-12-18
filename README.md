# Norwegian Utility Bill

The 'Norwegian Utility Bill' is a device to calculate utility and grid prices for Norway.

## Install

To install the device:

1. Add the 'Norwegian Utility Bill' device.
2. Go to 'Advanced settings'.  If you have a spot plan or fixed price plan, edit the price formula.
3. Adjust the settings for grid capacity and grid energy for your grid provider.
4. Add a flow to update consumption from a pulse device, eg. Tibber Pulse.  WHEN: Power changed, THEN: Update consumption with <POWER>.
5. If the price comes from a price source, eg. Tibber, select 'From flow', and create the flow: WHEN: Price changed, THEN: Update price with <PRICE>.


### Release Notes:

#### 1.0.2

- Can now see the grid price

#### 1.0.1

- Support existing grid costs regime
- Validation for the spot & fixed price cost formula
- Separate grid energy prices for winter and summer 
- Option for low price for weekends

#### 1.0.0

- Initial release
