"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSchedule = calculateSchedule;
exports.formatScheduleText = formatScheduleText;
const luxon_1 = require("luxon");
function calculateSchedule(input) {
    const eventDateTime = luxon_1.DateTime.fromISO(input.eventTime, {
        zone: input.timezone || 'local'
    });
    if (!eventDateTime.isValid) {
        throw new Error(`Invalid event time: ${input.eventTime}`);
    }
    // 1. T_must_arrive = T_event - E_arrive
    const mustArriveTime = eventDateTime.minus({ minutes: input.arriveEarly });
    // 2. T_leave_ex = T_must_arrive - (D_ex_event + B_drive)
    const leaveExTime = mustArriveTime.minus({
        minutes: input.exToEventDuration + input.driveBuffer
    });
    // 3. T_arrive_ex = T_leave_ex - R_pickup
    const arriveExTime = leaveExTime.minus({ minutes: input.pickupReady });
    // 4. T_leave_home_raw = T_arrive_ex - (D_home_ex + B_drive)
    const leaveHomeRaw = arriveExTime.minus({
        minutes: input.homeToExDuration + input.driveBuffer
    });
    // 5. T_leave_home = floor_to_interval(T_leave_home_raw, round_to)
    const leaveHomeTime = floorToInterval(leaveHomeRaw, input.roundTo);
    // Validate that we don't have negative times or impossible schedules
    if (leaveHomeTime >= eventDateTime) {
        throw new Error('Schedule impossible: Leave home time is after event time. Reduce travel times or buffers.');
    }
    if (leaveHomeTime.day !== eventDateTime.day && leaveHomeTime < eventDateTime.minus({ days: 1 })) {
        console.warn('Warning: Schedule requires leaving home more than 24 hours before event');
    }
    return {
        leaveHome: leaveHomeTime.toFormat('h:mm a'),
        arriveEx: arriveExTime.toFormat('h:mm a'),
        leaveEx: leaveExTime.toFormat('h:mm a'),
        arriveEvent: mustArriveTime.toFormat('h:mm a'),
        homeToExDuration: input.homeToExDuration,
        exToEventDuration: input.exToEventDuration,
        driveBuffer: input.driveBuffer,
        pickupReady: input.pickupReady,
        arriveEarly: input.arriveEarly,
    };
}
function floorToInterval(dateTime, intervalMinutes) {
    const minutes = dateTime.minute;
    const flooredMinutes = Math.floor(minutes / intervalMinutes) * intervalMinutes;
    return dateTime.set({ minute: flooredMinutes, second: 0, millisecond: 0 });
}
function formatScheduleText(schedule) {
    return [
        `Leave home by ${schedule.leaveHome} - ${schedule.homeToExDuration} min drive to ex's (+${schedule.driveBuffer})`,
        `Arrive ex's at ${schedule.arriveEx} - ${schedule.pickupReady} mins to get ready`,
        `Leave ex's by ${schedule.leaveEx} - ${schedule.exToEventDuration} min drive to event (+${schedule.driveBuffer})`,
        `Arrive event at ${schedule.arriveEvent} (arrive early ${schedule.arriveEarly} mins)`
    ].join('\n');
}
//# sourceMappingURL=scheduler.js.map