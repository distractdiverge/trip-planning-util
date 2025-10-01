#!/usr/bin/env node

import { Command } from 'commander';
import { DateTime } from 'luxon';
import { calculateSchedule, formatScheduleText } from './lib/scheduler.js';
import { PlanInputSchema, Config } from './lib/types.js';
import { ConfigManager } from './lib/config.js';
import { OutputFormatter } from './lib/formatter.js';
import { RouteParser } from './lib/route-parser.js';

const program = new Command();
const configManager = new ConfigManager();
const formatter = new OutputFormatter();
const routeParser = new RouteParser(configManager);

program
  .name('planner')
  .description('Two-Leg Travel Planner CLI')
  .version('1.0.0');

program
  .command('plan')
  .description('Calculate and display travel schedule')
  .requiredOption('--arrive <time>', 'Event arrival time (ISO format or time like "5:50pm")')
  .option('--date <date>', 'Date for the event (if using time format for --arrive)')
  .option('--event <name>', 'Event venue name/alias')
  .option('--event-address <address>', 'Event venue address')
  .option('--stop <name>', 'Stop location name/alias')
  .option('--stop-address <address>', 'Stop location address')
  .option('--home <name>', 'Home name/alias')
  .option('--home-address <address>', 'Home address')
  .option('--arrive-early <minutes>', 'Minutes to arrive early at event', '10')
  .option('--pickup-ready <minutes>', 'Minutes needed at ex\'s to get ready', '10')
  .option('--drive-buffer <minutes>', 'Extra minutes per drive leg', '5')
  .option('--round <minutes>', 'Round departure times to nearest N minutes', '5')
  .option('--manual-home-stop <minutes>', 'Manual drive time from home to stop')
  .option('--manual-stop-event <minutes>', 'Manual drive time from stop to event')
  .option('--auto', 'Use automatic travel time estimation (future feature)')
  .option('--format <type>', 'Output format: text, json, ics', 'text')
  .option('--timezone <tz>', 'Timezone (auto-detected by default)')
  .option('--profile <name>', 'Use configuration profile')
  .action(async (options) => {
    try {
      const config = await configManager.getConfig();
      const profile = options.profile ? config.profiles[options.profile] : null;
      
      // Parse arrival time
      let eventTime: string;
      if (options.arrive.includes('T') || options.arrive.includes('Z')) {
        eventTime = options.arrive;
      } else {
        if (!options.date) {
          throw new Error('--date is required when using time format for --arrive');
        }
        const dateTime = DateTime.fromFormat(`${options.date} ${options.arrive}`, 'yyyy-MM-dd h:mma');
        if (!dateTime.isValid) {
          throw new Error(`Invalid date/time format. Use --date "YYYY-MM-DD" and --arrive "H:MMam/pm"`);
        }
        eventTime = dateTime.toISO()!;
      }

      // Resolve addresses from aliases (optional for manual mode)
      const resolveAddress = (name?: string, address?: string, required: boolean = false) => {
        if (address) return address;
        if (name && config.aliases[name]) return config.aliases[name];
        if (name && profile?.venues?.[name]) return profile.venues[name];
        if (required) {
          throw new Error(`Address not found for "${name}". Use --<location>-address or add to config.`);
        }
        return null;
      };

      // Resolve addresses if provided (for future auto travel time features)
      const homeAddress = resolveAddress(options.home, options.homeAddress);
      const stopAddress = resolveAddress(options.stop, options.stopAddress);
      const eventAddress = resolveAddress(options.event, options.eventAddress);

      // Get travel durations
      if (!options.manualHomeStop || !options.manualStopEvent) {
        throw new Error('Manual travel times required. Use --manual-home-stop and --manual-stop-event');
      }

      const input = PlanInputSchema.parse({
        eventTime,
        arriveEarly: parseInt(options.arriveEarly),
        pickupReady: parseInt(options.pickupReady),
        driveBuffer: parseInt(options.driveBuffer),
        roundTo: parseInt(options.round),
        homeToStopDuration: parseInt(options.manualHomeStop),
        stopToEventDuration: parseInt(options.manualStopEvent),
        timezone: options.timezone,
      });

      const schedule = calculateSchedule(input);
      
      switch (options.format) {
        case 'text':
          console.log(formatScheduleText(schedule));
          break;
        case 'json':
          console.log(JSON.stringify(schedule, null, 2));
          break;
        case 'ics':
          const icsContent = await formatter.formatICS(schedule, eventTime);
          console.log(icsContent);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage configuration')
  .option('--list', 'List current configuration')
  .option('--set-alias <alias>', 'Set address alias in format "name=address"')
  .option('--remove-alias <name>', 'Remove address alias')
  .option('--add-location <location>', 'Add location in format "category:name=address" (categories: homes, schools, venues, stops, other)')
  .option('--remove-location <location>', 'Remove location in format "category:name"')
  .option('--list-locations [category]', 'List locations (optionally filter by category)')
  .option('--profile <name>', 'Create or edit profile')
  .action(async (options) => {
    try {
      if (options.list) {
        const config = await configManager.getConfig();
        console.log(JSON.stringify(config, null, 2));
      } else if (options.setAlias) {
        const aliasStr = options.setAlias;
        const equalIndex = aliasStr.indexOf('=');
        if (equalIndex === -1) {
          throw new Error('Invalid alias format. Use: --set-alias "name=address"');
        }
        const name = aliasStr.substring(0, equalIndex).trim();
        const address = aliasStr.substring(equalIndex + 1).trim();
        if (!name || !address) {
          throw new Error('Both name and address are required. Use: --set-alias "name=address"');
        }
        await configManager.setAlias(name, address);
        console.log(`Alias "${name}" set to "${address}"`);
      } else if (options.removeAlias) {
        await configManager.removeAlias(options.removeAlias);
        console.log(`Alias "${options.removeAlias}" removed`);
      } else if (options.addLocation) {
        const locationStr = options.addLocation;
        const colonIndex = locationStr.indexOf(':');
        const equalIndex = locationStr.indexOf('=');
        
        if (colonIndex === -1 || equalIndex === -1 || equalIndex < colonIndex) {
          throw new Error('Invalid location format. Use: --add-location "category:name=address"');
        }
        
        const category = locationStr.substring(0, colonIndex).trim() as keyof Config['locations'];
        const name = locationStr.substring(colonIndex + 1, equalIndex).trim();
        const address = locationStr.substring(equalIndex + 1).trim();
        
        const validCategories = ['homes', 'schools', 'venues', 'stops', 'other'];
        if (!validCategories.includes(category)) {
          throw new Error(`Invalid category "${category}". Valid categories: ${validCategories.join(', ')}`);
        }
        
        if (!name || !address) {
          throw new Error('Both name and address are required. Use: --add-location "category:name=address"');
        }
        
        await configManager.addLocation(category, name, address);
        console.log(`Location "${name}" added to ${category}: ${address}`);
      } else if (options.removeLocation) {
        const locationStr = options.removeLocation;
        const colonIndex = locationStr.indexOf(':');
        
        if (colonIndex === -1) {
          throw new Error('Invalid location format. Use: --remove-location "category:name"');
        }
        
        const category = locationStr.substring(0, colonIndex).trim() as keyof Config['locations'];
        const name = locationStr.substring(colonIndex + 1).trim();
        
        await configManager.removeLocation(category, name);
        console.log(`Location "${name}" removed from ${category}`);
      } else if (options.listLocations !== undefined) {
        const config = await configManager.getConfig();
        
        if (typeof options.listLocations === 'string' && options.listLocations.length > 0) {
          // Filter by specific category
          const category = options.listLocations as keyof Config['locations'];
          if (config.locations[category]) {
            console.log(`\n📍 ${category.toUpperCase()}:`);
            for (const [name, address] of Object.entries(config.locations[category])) {
              console.log(`  ${name}: ${address}`);
            }
          } else {
            console.log(`Category "${category}" not found.`);
          }
        } else {
          // List all locations by category
          console.log('\n📍 ALL LOCATIONS:');
          for (const [category, locations] of Object.entries(config.locations)) {
            if (Object.keys(locations).length > 0) {
              console.log(`\n${category.toUpperCase()}:`);
              for (const [name, address] of Object.entries(locations)) {
                console.log(`  ${name}: ${address}`);
              }
            }
          }
        }
      } else {
        console.log('Use --list to view configuration, --set-alias to set aliases, or --remove-alias to remove aliases');
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('cache')
  .description('Manage travel time cache')
  .option('--clear', 'Clear cache')
  .option('--show', 'Show cache contents')
  .action((options) => {
    if (options.clear) {
      console.log('Cache clearing not yet implemented');
    } else if (options.show) {
      console.log('Cache display not yet implemented');
    } else {
      console.log('Use --clear to clear cache or --show to display cache');
    }
  });

program
  .command('route')
  .description('Plan route using natural language (e.g. "from home to school")')
  .requiredOption('--route <description>', 'Route description like "from home to school" or "from home via ex\'s house to school"')
  .requiredOption('--arrive <time>', 'Event arrival time (ISO format or time like "5:50pm")')
  .option('--date <date>', 'Date for the event (if using time format for --arrive)')
  .option('--arrive-early <minutes>', 'Minutes to arrive early at event', '10')
  .option('--pickup-ready <minutes>', 'Minutes needed at stop to get ready', '10')
  .option('--drive-buffer <minutes>', 'Extra minutes per drive leg', '5')
  .option('--round <minutes>', 'Round departure times to nearest N minutes', '5')
  .option('--home-stop-time <minutes>', 'Manual drive time from start to stop')
  .option('--stop-destination-time <minutes>', 'Manual drive time from stop to destination')
  .option('--format <type>', 'Output format: text, json, ics', 'text')
  .option('--timezone <tz>', 'Timezone (auto-detected by default)')
  .option('--profile <name>', 'Use configuration profile')
  .action(async (options) => {
    try {
      const config = await configManager.getConfig();
      const profile = options.profile ? config.profiles[options.profile] : null;
      
      // Parse arrival time
      let eventTime: string;
      if (options.arrive.includes('T') || options.arrive.includes('Z')) {
        eventTime = options.arrive;
      } else {
        if (!options.date) {
          throw new Error('--date is required when using time format for --arrive');
        }
        const dateTime = DateTime.fromFormat(`${options.date} ${options.arrive}`, 'yyyy-MM-dd h:mma');
        if (!dateTime.isValid) {
          throw new Error(`Invalid date/time format. Use --date "YYYY-MM-DD" and --arrive "H:MMam/pm"`);
        }
        eventTime = dateTime.toISO()!;
      }

      // Parse the route
      let parsedRoute;
      try {
        // Try three-location syntax first (from X via Y to Z)
        parsedRoute = await routeParser.parseThreeLocationRoute(options.route);
      } catch {
        // Fall back to two-location syntax (from X to Y)
        parsedRoute = await routeParser.parseRoute(options.route);
      }

      console.log(`📍 Route: ${parsedRoute.start} → ${parsedRoute.stop} → ${parsedRoute.destination}`);

      // Get travel durations
      let homeToStopDuration: number;
      let stopToDestinationDuration: number;

      if (options.homeStopTime && options.stopDestinationTime) {
        homeToStopDuration = parseInt(options.homeStopTime);
        stopToDestinationDuration = parseInt(options.stopDestinationTime);
      } else {
        throw new Error('Manual travel times required. Use --home-stop-time and --stop-destination-time');
      }

      const input = PlanInputSchema.parse({
        eventTime,
        arriveEarly: parseInt(options.arriveEarly),
        pickupReady: parseInt(options.pickupReady),
        driveBuffer: parseInt(options.driveBuffer),
        roundTo: parseInt(options.round),
        homeToStopDuration,
        stopToEventDuration: stopToDestinationDuration,
        timezone: options.timezone,
      });

      const schedule = calculateSchedule(input);
      
      switch (options.format) {
        case 'text':
          console.log(formatScheduleText(schedule));
          break;
        case 'json':
          console.log(JSON.stringify(schedule, null, 2));
          break;
        case 'ics':
          const icsContent = await formatter.formatICS(schedule, eventTime);
          console.log(icsContent);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();