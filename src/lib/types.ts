import { z } from 'zod';

export const PlanInputSchema = z.object({
  eventTime: z.string().datetime(),
  arriveEarly: z.number().min(0).default(10),
  pickupReady: z.number().min(0).default(10),
  driveBuffer: z.number().min(0).default(5),
  roundTo: z.number().min(1).default(5),
  homeToExDuration: z.number().min(0),
  exToEventDuration: z.number().min(0),
  timezone: z.string().optional(),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;

export interface ScheduleResult {
  leaveHome: string;
  arriveEx: string;
  leaveEx: string;
  arriveEvent: string;
  homeToExDuration: number;
  exToEventDuration: number;
  driveBuffer: number;
  pickupReady: number;
  arriveEarly: number;
}

export interface ConfigProfile {
  name: string;
  defaults: {
    arriveEarly: number;
    pickupReady: number;
    driveBuffer: number;
    roundTo: number;
  };
  venues?: Record<string, string>;
}

export interface Config {
  profiles: Record<string, ConfigProfile>;
  aliases: Record<string, string>;
  defaults: {
    arriveEarly: number;
    pickupReady: number;
    driveBuffer: number;
    roundTo: number;
    timezone: string;
  };
}