import Homey from 'homey';

const math = require('./math');
const Logger = require('./Logger');

export class BaseDriver extends Homey.Driver {

    logger: any;

    async onInit(): Promise<void> {
        this.logger = new Logger({
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
