import { z } from 'zod';

export const PlanInputSchema = z.object({
  eventTime: z.string(),
  arriveEarly: z.number().min(0).default(10),
  pickupReady: z.number().min(0).default(10),
  driveBuffer: z.number().min(0).default(5),
  roundTo: z.number().min(1).default(5),
  homeToStopDuration: z.number().min(0),
  stopToEventDuration: z.number().min(0),
  timezone: z.string().optional(),
});

export type PlanInput = z.infer<typeof PlanInputSchema>;

export interface ScheduleResult {
  leaveHome: string;
  arriveStop: string;
  leaveStop: string;
  arriveEvent: string;
  homeToStopDuration: number;
  stopToEventDuration: number;
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

export interface LocationCategory {
  [locationName: string]: string; // location name -> address
}

export interface Config {
  profiles: Record<string, ConfigProfile>;
  aliases: Record<string, string>;
  locations: {
    homes: LocationCategory;
    schools: LocationCategory;
    venues: LocationCategory;
    stops: LocationCategory;
    other: LocationCategory;
  };
  defaults: {
    arriveEarly: number;
    pickupReady: number;
    driveBuffer: number;
    roundTo: number;
    timezone: string;
  };
}

export interface RouteInput {
  from: string;
  to: string;
  eventTime: string;
  arriveEarly?: number;
  pickupReady?: number;
  driveBuffer?: number;
  roundTo?: number;
  timezone?: string;
}