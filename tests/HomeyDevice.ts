export class HomeyDevice {

    logging?: boolean;
    capabilities: Map<string, any>;
    settings: any;
    store: Map<string, any>;
    homey: any;
    logger: any;

    constructor() {
        this.logging = false;
        this.capabilities = new Map<string, any>();
        this.settings = {};
        this.store = new Map<string, any>();
        this.homey = {
            "__": (key: string, obj: any) => key
        }
        this.logger = {
            log: this.log,
            silly: this.log,
            debug: this.log,
            verbose: this.log,
            info: this.log,
            warn: this.log,
            error: this.error,
        }
    }

    enableLogging(logging: boolean): void {
        this.logging = logging;
    }

    log(...args: any[]): void {
        if (this.logging) {
            console.log(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
        }
    }

    error(...args: any[]): void {
        if (this.logging) {
            console.log(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
        }
    }

    getCapabilityValues(): Map<string, any> {
        return this.capabilities;
    }

    getCapabilityValue(capabilityId: string): any {
        return this.capabilities.get(capabilityId);
    }

    async setCapabilityValue(capabilityId: string, value: any): Promise<void> {
        this.capabilities.set(capabilityId, value);
    }

    getSetting(key: string): any {
        return this.settings[key];
    }

    getSettings(): any {
        return this.settings;
    }

    async setSettings(newSettings: any): Promise<void> {
        this.settings = {
            ...this.settings,
            ...newSettings
        }
    }

    getStoreValue(key: string): any {
        return this.store.get(key);
    }

    async setStoreValue(key: string, value: any): Promise<void> {
        this.store.set(key, value);
    }

}