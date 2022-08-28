export class HomeyDevice {

    private logging?: boolean;
    capabilities: Map<string, any>;
    settings: any;
    store: Map<string, any>;
    homey: any;
    logger: any;

    constructor() {
        this.capabilities = new Map<string, any>();
        this.settings = {};
        this.store = new Map<string, any>();
        this.homey = {
            "__": (key: string, obj: any) => key
        }
        this.logger = {
            log: this.log.bind(this),
            silly: this.log.bind(this),
            debug: this.log.bind(this),
            verbose: this.log.bind(this),
            info: this.log.bind(this),
            warn: this.log.bind(this),
            error: this.error.bind(this),
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

    hasCapability(capabilityId: string): any {
        return true;
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