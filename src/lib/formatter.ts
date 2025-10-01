import { DateTime } from 'luxon';
import { createEvent, EventAttributes } from 'ics';
import { ScheduleResult } from './types.js';

export class OutputFormatter {
  async formatICS(schedule: ScheduleResult, eventTimeISO: string): Promise<string> {
    const eventDateTime = DateTime.fromISO(eventTimeISO);
    const date = eventDateTime.toFormat('yyyy-MM-dd');
    
    // Parse times for the same date
    const parseTime = (timeStr: string): DateTime => {
      return DateTime.fromFormat(`${date} ${timeStr}`, 'yyyy-MM-dd h:mm a', {
        zone: eventDateTime.zone
      });
    };

    const leaveHomeTime = parseTime(schedule.leaveHome);
    const arriveStopTime = parseTime(schedule.arriveStop);
    const leaveStopTime = parseTime(schedule.leaveStop);
    const arriveEventTime = parseTime(schedule.arriveEvent);

    const events: EventAttributes[] = [
      {
        start: this.dateTimeToDateArray(leaveHomeTime),
        end: this.dateTimeToDateArray(arriveStopTime),
        title: `Drive to Stop`,
        description: `${schedule.homeToStopDuration} min drive (+${schedule.driveBuffer} buffer)`,
        location: 'Home → Stop',
      },
      {
        start: this.dateTimeToDateArray(arriveStopTime),
        end: this.dateTimeToDateArray(leaveStopTime),
        title: `Pickup at Stop`,
        description: `${schedule.pickupReady} mins to get ready`,
        location: 'Stop',
      },
      {
        start: this.dateTimeToDateArray(leaveStopTime),
        end: this.dateTimeToDateArray(arriveEventTime),
        title: `Drive to Event`,
        description: `${schedule.stopToEventDuration} min drive (+${schedule.driveBuffer} buffer)`,
        location: 'Stop → Event Venue',
      },
    ];

    let icsContent = '';
    for (const event of events) {
      const { error, value } = createEvent(event);
      if (error) {
        throw new Error(`Failed to create ICS event: ${error}`);
      }
      icsContent += value + '\n';
    }

    return icsContent;
  }

  private dateTimeToDateArray(dt: DateTime): [number, number, number, number, number] {
    return [
      dt.year,
      dt.month,
      dt.day,
      dt.hour,
      dt.minute
    ];
  }

  formatSummary(schedule: ScheduleResult): string {
    return [
      '📅 Travel Schedule Summary:',
      '',
      `• ${schedule.leaveHome} - Leave home`,
      `• ${schedule.arriveStop} - Arrive at stop`,
      `• ${schedule.leaveStop} - Leave stop`,
      `• ${schedule.arriveEvent} - Arrive at event`,
      '',
      '🚗 Drive Times:',
      `• Home → Stop: ${schedule.homeToStopDuration} min (+${schedule.driveBuffer} buffer)`,
      `• Stop → Event: ${schedule.stopToEventDuration} min (+${schedule.driveBuffer} buffer)`,
      '',
      '⏱️ Buffers:',
      `• Arrive early: ${schedule.arriveEarly} min`,
      `• Pickup ready: ${schedule.pickupReady} min`,
    ].join('\n');
  }
}