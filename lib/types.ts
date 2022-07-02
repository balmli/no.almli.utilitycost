
export class GridSettings {
    gridCapacity0_2!: number;
    gridCapacity2_5!: number;
    gridCapacity5_10!: number;
    gridCapacity10_15!: number;
    gridCapacity15_20!: number;
    gridCapacity20_25!: number;
    gridCapacityAverage!: string;

    gridEnergyDay!: number;
    gridEnergyNight!: number;
    gridEnergyLowWeekends!: boolean;
    gridEnergyLowHoliday?: boolean;
}

export class GridSettingsConfig {
    id!: string;
    description!: string;
    gridNewRegimeStart!: string;
    gridSettings!: GridSettings;
}

export type GridSettingsConfigMap = { [key: string]: GridSettingsConfig };

export class DeviceSettings {
    priceCalcMethod!: string;
    priceArea!: string;
    costFormula!: string;
    costFormulaFixedAmount!: string;

    gridCapacity0_2!: number;
    gridCapacity2_5!: number;
    gridCapacity5_10!: number;
    gridCapacity10_15!: number;
    gridCapacity15_20!: number;
    gridCapacity20_25!: number;
    gridCapacityAverage!: string;

    gridEnergyDay!: number;
    gridEnergyNight!: number;
    gridEnergyLowWeekends!: boolean;

    priceDecimals!: number;
    resetEnergyDaily!: boolean;
}

export class StartValues {
    now!: any;
    thisUpdate!: number;
    lastUpdate?: number;
    startOfHour!: number;
    startOfDay!: number;
    startOfMonth!: number;
    startOfYear!: number;
    newHour!: boolean;
    newDay!: boolean;
    newMonth!: boolean;
    newYear!: boolean;
}

export class MaxConsumptionDay {
    startOfDay!: number;
    consumption!: number;
}

export class StoreValues {
    consumptionMinute?: boolean;
    lastConsumptionUpdate?: number;
    highest_10_hours?: MaxConsumptionDay[];
    prevCapacityCost?: number;
}

export class DeviceHandlerOptions {
    addFixedUtilityCosts?: boolean;
    addCapabilityCosts?: boolean;
}

export const DEFAULT_DEVICE_HANDLER_OPTIONS: DeviceHandlerOptions = {
    addFixedUtilityCosts: true,
    addCapabilityCosts: true,
}
