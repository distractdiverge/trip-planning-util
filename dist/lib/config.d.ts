import { Config, ConfigProfile } from './types.js';
export declare class ConfigManager {
    private configDir;
    private configPath;
    constructor();
    private getDefaultConfig;
    ensureConfigDir(): Promise<void>;
    getConfig(): Promise<Config>;
    saveConfig(config: Config): Promise<void>;
    setAlias(name: string, address: string): Promise<void>;
    createProfile(name: string, profile: ConfigProfile): Promise<void>;
    removeAlias(name: string): Promise<void>;
    removeProfile(name: string): Promise<void>;
}
//# sourceMappingURL=config.d.ts.map