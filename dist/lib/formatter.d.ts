import { ScheduleResult } from './types.js';
export declare class OutputFormatter {
    formatICS(schedule: ScheduleResult, eventTimeISO: string): Promise<string>;
    private dateTimeToDateArray;
    formatSummary(schedule: ScheduleResult): string;
}
//# sourceMappingURL=formatter.d.ts.map