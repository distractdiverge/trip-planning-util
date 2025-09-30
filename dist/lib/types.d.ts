import { z } from 'zod';
export declare const PlanInputSchema: z.ZodObject<{
    eventTime: z.ZodString;
    arriveEarly: z.ZodDefault<z.ZodNumber>;
    pickupReady: z.ZodDefault<z.ZodNumber>;
    driveBuffer: z.ZodDefault<z.ZodNumber>;
    roundTo: z.ZodDefault<z.ZodNumber>;
    homeToExDuration: z.ZodNumber;
    exToEventDuration: z.ZodNumber;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    eventTime: string;
    arriveEarly: number;
    pickupReady: number;
    driveBuffer: number;
    roundTo: number;
    homeToExDuration: number;
    exToEventDuration: number;
    timezone?: string | undefined;
}, {
    eventTime: string;
    homeToExDuration: number;
    exToEventDuration: number;
    arriveEarly?: number | undefined;
    pickupReady?: number | undefined;
    driveBuffer?: number | undefined;
    roundTo?: number | undefined;
    timezone?: string | undefined;
}>;
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
//# sourceMappingURL=types.d.ts.map