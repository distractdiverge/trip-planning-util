#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const luxon_1 = require("luxon");
const scheduler_js_1 = require("./lib/scheduler.js");
const types_js_1 = require("./lib/types.js");
const config_js_1 = require("./lib/config.js");
const formatter_js_1 = require("./lib/formatter.js");
const program = new commander_1.Command();
const configManager = new config_js_1.ConfigManager();
const formatter = new formatter_js_1.OutputFormatter();
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
    .option('--ex <name>', 'Ex\'s house name/alias')
    .option('--ex-address <address>', 'Ex\'s house address')
    .option('--home <name>', 'Home name/alias')
    .option('--home-address <address>', 'Home address')
    .option('--arrive-early <minutes>', 'Minutes to arrive early at event', '10')
    .option('--pickup-ready <minutes>', 'Minutes needed at ex\'s to get ready', '10')
    .option('--drive-buffer <minutes>', 'Extra minutes per drive leg', '5')
    .option('--round <minutes>', 'Round departure times to nearest N minutes', '5')
    .option('--manual-home-ex <minutes>', 'Manual drive time from home to ex\'s')
    .option('--manual-ex-event <minutes>', 'Manual drive time from ex\'s to event')
    .option('--auto', 'Use automatic travel time estimation (future feature)')
    .option('--format <type>', 'Output format: text, json, ics', 'text')
    .option('--timezone <tz>', 'Timezone (auto-detected by default)')
    .option('--profile <name>', 'Use configuration profile')
    .action(async (options) => {
    try {
        const config = await configManager.getConfig();
        const profile = options.profile ? config.profiles[options.profile] : null;
        // Parse arrival time
        let eventTime;
        if (options.arrive.includes('T') || options.arrive.includes('Z')) {
            eventTime = options.arrive;
        }
        else {
            if (!options.date) {
                throw new Error('--date is required when using time format for --arrive');
            }
            const dateTime = luxon_1.DateTime.fromFormat(`${options.date} ${options.arrive}`, 'yyyy-MM-dd h:mm a');
            eventTime = dateTime.toISO();
        }
        // Resolve addresses from aliases
        const resolveAddress = (name, address) => {
            if (address)
                return address;
            if (name && config.aliases[name])
                return config.aliases[name];
            if (name && profile?.venues?.[name])
                return profile.venues[name];
            throw new Error(`Address not found for "${name}". Use --<location>-address or add to config.`);
        };
        // Get travel durations
        if (!options.manualHomeEx || !options.manualExEvent) {
            throw new Error('Manual travel times required. Use --manual-home-ex and --manual-ex-event');
        }
        const input = types_js_1.PlanInputSchema.parse({
            eventTime,
            arriveEarly: parseInt(options.arriveEarly),
            pickupReady: parseInt(options.pickupReady),
            driveBuffer: parseInt(options.driveBuffer),
            roundTo: parseInt(options.round),
            homeToExDuration: parseInt(options.manualHomeEx),
            exToEventDuration: parseInt(options.manualExEvent),
            timezone: options.timezone,
        });
        const schedule = (0, scheduler_js_1.calculateSchedule)(input);
        switch (options.format) {
            case 'text':
                console.log((0, scheduler_js_1.formatScheduleText)(schedule));
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
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('config')
    .description('Manage configuration')
    .option('--list', 'List current configuration')
    .option('--set-alias <name> <address>', 'Set address alias')
    .option('--profile <name>', 'Create or edit profile')
    .action(async (options) => {
    try {
        if (options.list) {
            const config = await configManager.getConfig();
            console.log(JSON.stringify(config, null, 2));
        }
        else if (options.setAlias) {
            // TODO: Implement alias setting
            console.log('Alias setting not yet implemented');
        }
        else {
            console.log('Use --list to view configuration or --set-alias to set aliases');
        }
    }
    catch (error) {
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
    }
    else if (options.show) {
        console.log('Cache display not yet implemented');
    }
    else {
        console.log('Use --clear to clear cache or --show to display cache');
    }
});
program.parse();
//# sourceMappingURL=cli.js.map