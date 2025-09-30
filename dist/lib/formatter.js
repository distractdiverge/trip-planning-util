"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputFormatter = void 0;
const luxon_1 = require("luxon");
const ics_1 = require("ics");
class OutputFormatter {
    async formatICS(schedule, eventTimeISO) {
        const eventDateTime = luxon_1.DateTime.fromISO(eventTimeISO);
        const date = eventDateTime.toFormat('yyyy-MM-dd');
        // Parse times for the same date
        const parseTime = (timeStr) => {
            return luxon_1.DateTime.fromFormat(`${date} ${timeStr}`, 'yyyy-MM-dd h:mm a', {
                zone: eventDateTime.zone
            });
        };
        const leaveHomeTime = parseTime(schedule.leaveHome);
        const arriveExTime = parseTime(schedule.arriveEx);
        const leaveExTime = parseTime(schedule.leaveEx);
        const arriveEventTime = parseTime(schedule.arriveEvent);
        const events = [
            {
                start: this.dateTimeToDateArray(leaveHomeTime),
                end: this.dateTimeToDateArray(arriveExTime),
                title: `Drive to Ex's House`,
                description: `${schedule.homeToExDuration} min drive (+${schedule.driveBuffer} buffer)`,
                location: 'Home → Ex\'s House',
            },
            {
                start: this.dateTimeToDateArray(arriveExTime),
                end: this.dateTimeToDateArray(leaveExTime),
                title: `Pickup at Ex's House`,
                description: `${schedule.pickupReady} mins to get ready`,
                location: 'Ex\'s House',
            },
            {
                start: this.dateTimeToDateArray(leaveExTime),
                end: this.dateTimeToDateArray(arriveEventTime),
                title: `Drive to Event`,
                description: `${schedule.exToEventDuration} min drive (+${schedule.driveBuffer} buffer)`,
                location: 'Ex\'s House → Event Venue',
            },
        ];
        let icsContent = '';
        for (const event of events) {
            const { error, value } = (0, ics_1.createEvent)(event);
            if (error) {
                throw new Error(`Failed to create ICS event: ${error}`);
            }
            icsContent += value + '\n';
        }
        return icsContent;
    }
    dateTimeToDateArray(dt) {
        return [
            dt.year,
            dt.month,
            dt.day,
            dt.hour,
            dt.minute
        ];
    }
    formatSummary(schedule) {
        return [
            '📅 Travel Schedule Summary:',
            '',
            `• ${schedule.leaveHome} - Leave home`,
            `• ${schedule.arriveEx} - Arrive at ex's house`,
            `• ${schedule.leaveEx} - Leave ex's house`,
            `• ${schedule.arriveEvent} - Arrive at event`,
            '',
            '🚗 Drive Times:',
            `• Home → Ex's: ${schedule.homeToExDuration} min (+${schedule.driveBuffer} buffer)`,
            `• Ex's → Event: ${schedule.exToEventDuration} min (+${schedule.driveBuffer} buffer)`,
            '',
            '⏱️ Buffers:',
            `• Arrive early: ${schedule.arriveEarly} min`,
            `• Pickup ready: ${schedule.pickupReady} min`,
        ].join('\n');
    }
}
exports.OutputFormatter = OutputFormatter;
//# sourceMappingURL=formatter.js.map