"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRooms = getRooms;
exports.createRoom = createRoom;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
async function getRooms(req, res) {
    const messId = req.activeMessId || req.query.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const rooms = await database_1.prisma.room.findMany({
        where: { messId, deletedAt: null },
        include: {
            beds: {
                include: {
                    member: {
                        include: { user: { select: { id: true, name: true, phone: true } } },
                    },
                },
            },
        },
        orderBy: { number: "asc" },
    });
    return (0, response_1.sendList)(res, rooms, { total: rooms.length });
}
async function createRoom(req, res) {
    const messId = req.activeMessId || req.body.messId;
    if (!messId)
        throw new errors_1.ValidationError("Mess ID required");
    const { number, floor, capacity } = req.body;
    if (!number)
        throw new errors_1.ValidationError("Room number required");
    const cap = Number(capacity || 1);
    const room = await database_1.prisma.room.create({
        data: {
            messId,
            number: String(number),
            floor: Number(floor || 0),
            capacity: cap,
            beds: {
                create: Array.from({ length: cap }, (_, i) => ({
                    number: `Bed-${i + 1}`,
                })),
            },
        },
        include: { beds: true },
    });
    return (0, response_1.sendSuccess)(res, room, "Room created", 201);
}
//# sourceMappingURL=room.controller.js.map