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

#### 1.4.6

- Prices for more grid companies

#### 1.4.5

- Bugfix for calculating grid capacity cost
- Prices for more grid companies

#### 1.4.4

- Prices for more grid companies

#### 1.4.3

- Prices for more grid companies

#### 1.4.2

- Prices for more grid companies

#### 1.4.1

- Function to update other apps with prices
- Prices for more grid companies

#### 1.3.0

- Added an option to calculate 'Level for grid capacity' as an average of highest consumption hours
- Added an option to select grid company for grid capacity and energy settings
- Fixed 'New level for grid capacity' trigger
- Added action cards to update utility cost settings

#### 1.2.2

- Avoid concurrency issues
- Ignore extreme power values

#### 1.2.1

- Small fix for action card 'Update energy with X kWh'

#### 1.2.0

- Added action card 'Update energy with X kWh' to update with energy (kWh) instead of power (W)

#### 1.1.1

- Added separate formula for fixed monthly utility costs

#### 1.1.0

- Added support for slave devices
- Added action cards to update settings
- Added 'MONTHLY_HOURS' tag that can be used in the utility price formula
- Added 'Energy' (kWh) and 'Energy this year' (kWh) capabilities
- Added action card to reset the 'Energy' (kWh) capability
- Added action card to reset all accumulated capabilities

#### 1.0.8

- Grid capacity cost is added as max. hourly consumption increases

#### 1.0.7

- Costs will be updated regularly even if consumption is not updated regularly

#### 1.0.6

- Fixed typo

#### 1.0.5

- Added trigger for 'Sum utility and grid price changed'
- Added options for number of decimals for prices

#### 1.0.4

- Can add more than one 'Norwegian Utility Bill' device
- Added 'Sum daily cost' and 'Sum yearly cost' capabilities
- Fixed calculation of grid yearly fixed amount

#### 1.0.3

- Fixed calculation of grid yearly fixed amount

#### 1.0.2

- Can now see the grid price
- Added trigger for 'New level for grid capacity'
- Added condition to check if current cost is below / above a specific value

#### 1.0.1

- Support existing grid costs regime
- Validation for the spot & fixed price cost formula
- Separate grid energy prices for winter and summer 
- Option for low price for weekends

#### 1.0.0

- Initial release
