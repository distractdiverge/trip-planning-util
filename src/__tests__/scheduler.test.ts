import { DateTime } from 'luxon';
import { calculateSchedule, formatScheduleText } from '../lib/scheduler';
import { PlanInput } from '../lib/types';

describe('calculateSchedule', () => {
  it('should calculate the golden test scenario correctly', () => {
    // Golden test from spec: Event at 6:00pm, arrive early 10 mins → must arrive 5:50pm
    // D_ex_event=15, D_home_ex=17, B_drive=5, R_pickup=10, round_to=5
    const input: PlanInput = {
      eventTime: '2025-10-01T18:00:00',  // 6:00 PM
      arriveEarly: 10,
      pickupReady: 10,
      driveBuffer: 5,
      roundTo: 5,
      homeToExDuration: 17,
      exToEventDuration: 15,
    };

    const result = calculateSchedule(input);

    // Expected calculations:
    // T_leave_ex = 5:50 - (15+5) = 5:30
    // T_arrive_ex = 5:30 - 10 = 5:20
    // T_leave_home_raw = 5:20 - (17+5) = 4:58
    // T_leave_home = floor_5min(4:58) = 4:55

    expect(result.leaveHome).toBe('4:55 PM');
    expect(result.arriveEx).toBe('5:20 PM');
    expect(result.leaveEx).toBe('5:30 PM');
    expect(result.arriveEvent).toBe('5:50 PM');
  });

  it('should handle rounding correctly', () => {
    const input: PlanInput = {
      eventTime: '2025-10-01T18:00:00',
      arriveEarly: 0,
      pickupReady: 0,
      driveBuffer: 0,
      roundTo: 15,
      homeToExDuration: 37, // Will result in 5:23, should round down to 5:15
      exToEventDuration: 0,
    };

    const result = calculateSchedule(input);
    expect(result.leaveHome).toBe('5:15 PM');
  });

  it('should handle different time zones', () => {
    const input: PlanInput = {
      eventTime: '2025-10-01T17:00:00',  // 5:00 PM local time
      arriveEarly: 10,
      pickupReady: 10,
      driveBuffer: 5,
      roundTo: 5,
      homeToExDuration: 17,
      exToEventDuration: 15,
      timezone: 'America/New_York',
    };

    const result = calculateSchedule(input);
    expect(result.arriveEvent).toBe('4:50 PM');
  });

  it('should handle crossing day boundaries', () => {
    const input: PlanInput = {
      eventTime: '2025-10-02T00:30:00', // 12:30 AM
      arriveEarly: 10,
      pickupReady: 10,
      driveBuffer: 5,
      roundTo: 5,
      homeToExDuration: 60,
      exToEventDuration: 30,
    };

    const result = calculateSchedule(input);
    // Should calculate times in previous day
    expect(result.leaveHome).toBe('10:30 PM');
    expect(result.arriveEvent).toBe('12:20 AM');
  });
});

describe('formatScheduleText', () => {
  it('should format the schedule text correctly', () => {
    const schedule = {
      leaveHome: '4:55 PM',
      arriveEx: '5:20 PM',
      leaveEx: '5:30 PM',
      arriveEvent: '5:50 PM',
      homeToExDuration: 17,
      exToEventDuration: 15,
      driveBuffer: 5,
      pickupReady: 10,
      arriveEarly: 10,
    };

    const formatted = formatScheduleText(schedule);
    const expected = [
      'Leave home by 4:55 PM - 17 min drive to ex\'s (+5)',
      'Arrive ex\'s at 5:20 PM - 10 mins to get ready',
      'Leave ex\'s by 5:30 PM - 15 min drive to event (+5)',
      'Arrive event at 5:50 PM (arrive early 10 mins)'
    ].join('\n');

    expect(formatted).toBe(expected);
  });
});

describe('edge cases', () => {
  it('should handle very short durations', () => {
    const input: PlanInput = {
      eventTime: '2025-10-01T18:00:00',
      arriveEarly: 0,
      pickupReady: 1,
      driveBuffer: 0,
      roundTo: 1,
      homeToExDuration: 1,
      exToEventDuration: 1,
    };

    const result = calculateSchedule(input);
    expect(result.leaveHome).toBe('5:57 PM');
  });

  it('should handle large durations', () => {
    const input: PlanInput = {
      eventTime: '2025-10-01T18:00:00',
      arriveEarly: 60,
      pickupReady: 30,
      driveBuffer: 15,
      roundTo: 5,
      homeToExDuration: 120,
      exToEventDuration: 90,
    };

    const result = calculateSchedule(input);
    expect(result.arriveEvent).toBe('5:00 PM');
    expect(result.leaveHome).toBe('12:30 PM');
  });
});