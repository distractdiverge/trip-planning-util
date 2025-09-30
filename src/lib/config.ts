import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Config, ConfigProfile } from './types.js';

export class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = join(homedir(), '.trip_planner');
    this.configPath = join(this.configDir, 'config.json');
  }

  private getDefaultConfig(): Config {
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

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.access(this.configDir);
    } catch {
      await fs.mkdir(this.configDir, { recursive: true });
    }
  }

  async getConfig(): Promise<Config> {
    try {
      await this.ensureConfigDir();
      const data = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If config doesn't exist or is invalid, return default
      const defaultConfig = this.getDefaultConfig();
      await this.saveConfig(defaultConfig);
      return defaultConfig;
    }
  }

  async saveConfig(config: Config): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  async setAlias(name: string, address: string): Promise<void> {
    const config = await this.getConfig();
    config.aliases[name] = address;
    await this.saveConfig(config);
  }

  async createProfile(name: string, profile: ConfigProfile): Promise<void> {
    const config = await this.getConfig();
    config.profiles[name] = profile;
    await this.saveConfig(config);
  }

  async removeAlias(name: string): Promise<void> {
    const config = await this.getConfig();
    delete config.aliases[name];
    await this.saveConfig(config);
  }

  async removeProfile(name: string): Promise<void> {
    if (name === 'default') {
      throw new Error('Cannot remove default profile');
    }
    const config = await this.getConfig();
    delete config.profiles[name];
    await this.saveConfig(config);
  }
}