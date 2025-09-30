"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
class ConfigManager {
    configDir;
    configPath;
    constructor() {
        this.configDir = (0, path_1.join)((0, os_1.homedir)(), '.trip_planner');
        this.configPath = (0, path_1.join)(this.configDir, 'config.json');
    }
    getDefaultConfig() {
        return {
            profiles: {
                default: {
                    name: 'default',
                    defaults: {
                        arriveEarly: 10,
                        pickupReady: 10,
                        driveBuffer: 5,
                        roundTo: 5,
                    },
                },
            },
            aliases: {},
            defaults: {
                arriveEarly: 10,
                pickupReady: 10,
                driveBuffer: 5,
                roundTo: 5,
                timezone: 'local',
            },
        };
    }
    async ensureConfigDir() {
        try {
            await fs_1.promises.access(this.configDir);
        }
        catch {
            await fs_1.promises.mkdir(this.configDir, { recursive: true });
        }
    }
    async getConfig() {
        try {
            await this.ensureConfigDir();
            const data = await fs_1.promises.readFile(this.configPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            // If config doesn't exist or is invalid, return default
            const defaultConfig = this.getDefaultConfig();
            await this.saveConfig(defaultConfig);
            return defaultConfig;
        }
    }
    async saveConfig(config) {
        await this.ensureConfigDir();
        await fs_1.promises.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    async setAlias(name, address) {
        const config = await this.getConfig();
        config.aliases[name] = address;
        await this.saveConfig(config);
    }
    async createProfile(name, profile) {
        const config = await this.getConfig();
        config.profiles[name] = profile;
        await this.saveConfig(config);
    }
    async removeAlias(name) {
        const config = await this.getConfig();
        delete config.aliases[name];
        await this.saveConfig(config);
    }
    async removeProfile(name) {
        if (name === 'default') {
            throw new Error('Cannot remove default profile');
        }
        const config = await this.getConfig();
        delete config.profiles[name];
        await this.saveConfig(config);
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map