import Homey from 'homey';

import Logger from '@balmli/homey-logger';

const math = require('./math');

export class BaseDriver extends Homey.Driver {

    logger: any;

    async onInit(): Promise<void> {
        this.logger = new Logger({
            logLevel: 3,
            prefix: undefined,
            logFunc: this.log,
            errorFunc: this.error,
        });

        this.logger.debug(`Driver onInit ${this.getDriverName()}`);
    }

    getDriverName(): string {
        throw new Error('Not implemented');
    }

    async onPairListDevices(): Promise<any[]> {
        const syncTime = Math.round(Math.random() * 3600);
        return [
            {
                name: this.getDriverName(),
                data: {
                    "id": math.guid()
                },
                store: {
                    syncTime
                }
            }
        ];
    }

}
