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
      locations: {
        homes: {
          'home': '123 Main St, Default City',
          'my house': '123 Main St, Default City',
        },
        schools: {
          'school': 'Elementary School, 456 School St',
          'the school': 'Elementary School, 456 School St',
        },
        venues: {
          'soccer field': 'Community Soccer Complex, 789 Sports Dr',
          'practice field': 'Community Soccer Complex, 789 Sports Dr',
        },
        stops: {
          "ex's house": '456 Oak Ave, Pickup Location',
          'pickup': '456 Oak Ave, Pickup Location',
        },
        other: {},
      },
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

  async addLocation(category: keyof Config['locations'], name: string, address: string): Promise<void> {
    const config = await this.getConfig();
    if (!config.locations[category]) {
      config.locations[category] = {};
    }
    config.locations[category][name.toLowerCase()] = address;
    await this.saveConfig(config);
  }

  async removeLocation(category: keyof Config['locations'], name: string): Promise<void> {
    const config = await this.getConfig();
    delete config.locations[category][name.toLowerCase()];
    await this.saveConfig(config);
  }

  findLocation(locationName: string): { address: string; category: string } | null {
    // This method will be called synchronously with a config object
    throw new Error('Use findLocationInConfig instead');
  }

  findLocationInConfig(config: Config, locationName: string): { address: string; category: string } | null {
    const searchName = locationName.toLowerCase().trim();
    
    // Search in all location categories
    for (const [category, locations] of Object.entries(config.locations)) {
      if (locations[searchName]) {
        return { address: locations[searchName], category };
      }
    }

    // Also search in old aliases for backward compatibility
    if (config.aliases[locationName]) {
      return { address: config.aliases[locationName], category: 'aliases' };
    }

    return null;
  }
}