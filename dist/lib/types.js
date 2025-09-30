"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanInputSchema = void 0;
const zod_1 = require("zod");
exports.PlanInputSchema = zod_1.z.object({
    eventTime: zod_1.z.string().datetime(),
    arriveEarly: zod_1.z.number().min(0).default(10),
    pickupReady: zod_1.z.number().min(0).default(10),
    driveBuffer: zod_1.z.number().min(0).default(5),
    roundTo: zod_1.z.number().min(1).default(5),
    homeToExDuration: zod_1.z.number().min(0),
    exToEventDuration: zod_1.z.number().min(0),
    timezone: zod_1.z.string().optional(),
});
//# sourceMappingURL=types.js.map