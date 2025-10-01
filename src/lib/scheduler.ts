import { DateTime } from 'luxon';
import { PlanInput, ScheduleResult } from './types.js';

export function calculateSchedule(input: PlanInput): ScheduleResult {
  const eventDateTime = DateTime.fromISO(input.eventTime, { 
    zone: input.timezone || 'local' 
  });

  if (!eventDateTime.isValid) {
    throw new Error(`Invalid event time: ${input.eventTime}`);
  }

  // 1. T_must_arrive = T_event - E_arrive
  const mustArriveTime = eventDateTime.minus({ minutes: input.arriveEarly });

  // 2. T_leave_stop = T_must_arrive - (D_stop_event + B_drive)
  const leaveStopTime = mustArriveTime.minus({ 
    minutes: input.stopToEventDuration + input.driveBuffer 
  });

  // 3. T_arrive_stop = T_leave_stop - R_pickup
  const arriveStopTime = leaveStopTime.minus({ minutes: input.pickupReady });

  // 4. T_leave_home_raw = T_arrive_stop - (D_home_stop + B_drive)
  const leaveHomeRaw = arriveStopTime.minus({ 
    minutes: input.homeToStopDuration + input.driveBuffer 
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
    arriveStop: arriveStopTime.toFormat('h:mm a'),
    leaveStop: leaveStopTime.toFormat('h:mm a'),
    arriveEvent: mustArriveTime.toFormat('h:mm a'),
    homeToStopDuration: input.homeToStopDuration,
    stopToEventDuration: input.stopToEventDuration,
    driveBuffer: input.driveBuffer,
    pickupReady: input.pickupReady,
    arriveEarly: input.arriveEarly,
  };
}

function floorToInterval(dateTime: DateTime, intervalMinutes: number): DateTime {
  const minutes = dateTime.minute;
  const flooredMinutes = Math.floor(minutes / intervalMinutes) * intervalMinutes;
  return dateTime.set({ minute: flooredMinutes, second: 0, millisecond: 0 });
}

export function formatScheduleText(schedule: ScheduleResult): string {
  return [
    `Leave home by ${schedule.leaveHome} - ${schedule.homeToStopDuration} min drive to stop (+${schedule.driveBuffer})`,
    `Arrive stop at ${schedule.arriveStop} - ${schedule.pickupReady} mins to get ready`,
    `Leave stop by ${schedule.leaveStop} - ${schedule.stopToEventDuration} min drive to event (+${schedule.driveBuffer})`,
    `Arrive event at ${schedule.arriveEvent} (arrive early ${schedule.arriveEarly} mins)`
  ].join('\n');
}