import { promises as fs } from 'fs';
import { join } from 'path';
import { ConfigManager } from '../lib/config';
import { Config } from '../lib/types';

// Mock fs and os modules
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('os', () => ({
  homedir: () => '/mock/home',
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default config when file does not exist', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('File not found'));
      mockedFs.writeFile.mockResolvedValue();

      const config = await configManager.getConfig();

      expect(config.profiles.default).toBeDefined();
      expect(config.defaults.arriveEarly).toBe(10);
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should return parsed config when file exists', async () => {
      const mockConfig: Config = {
        profiles: {
          custom: {
            name: 'custom',
            defaults: { arriveEarly: 15, pickupReady: 5, driveBuffer: 10, roundTo: 5 },
          },
        },
        aliases: { Home: '123 Main St' },
        defaults: { arriveEarly: 15, pickupReady: 5, driveBuffer: 10, roundTo: 5, timezone: 'UTC' },
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configManager.getConfig();

      expect(config).toEqual(mockConfig);
    });
  });

  describe('setAlias', () => {
    it('should add new alias to config', async () => {
      const initialConfig: Config = {
        profiles: { default: { name: 'default', defaults: { arriveEarly: 10, pickupReady: 10, driveBuffer: 5, roundTo: 5 } } },
        aliases: {},
        defaults: { arriveEarly: 10, pickupReady: 10, driveBuffer: 5, roundTo: 5, timezone: 'local' },
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(initialConfig));
      mockedFs.writeFile.mockResolvedValue();

      await configManager.setAlias('Home', '123 Main St');

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/mock/home/.trip_planner/config.json',
        expect.stringContaining('"Home": "123 Main St"')
      );
    });
  });

  describe('createProfile', () => {
    it('should add new profile to config', async () => {
      const initialConfig: Config = {
        profiles: { default: { name: 'default', defaults: { arriveEarly: 10, pickupReady: 10, driveBuffer: 5, roundTo: 5 } } },
        aliases: {},
        defaults: { arriveEarly: 10, pickupReady: 10, driveBuffer: 5, roundTo: 5, timezone: 'local' },
      };

      const newProfile = {
        name: 'soccer',
        defaults: { arriveEarly: 15, pickupReady: 5, driveBuffer: 10, roundTo: 5 },
        venues: { 'Soccer Field': '456 Sports Ave' },
      };

      mockedFs.readFile.mockResolvedValue(JSON.stringify(initialConfig));
      mockedFs.writeFile.mockResolvedValue();

      await configManager.createProfile('soccer', newProfile);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/mock/home/.trip_planner/config.json',
        expect.stringContaining('"soccer"')
      );
    });
  });
});