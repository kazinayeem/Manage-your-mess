"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateEqualSplit = calculateEqualSplit;
exports.calculateRoomBasedSplit = calculateRoomBasedSplit;
exports.calculateCustomSplit = calculateCustomSplit;
exports.computeBillSplit = computeBillSplit;
exports.calculatePeriodEnd = calculatePeriodEnd;
function distributeAmount(total, weights) {
    const result = new Map();
    if (weights.length === 0 || total <= 0)
        return result;
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
    if (totalWeight <= 0)
        return result;
    let allocated = 0;
    const shares = weights.map((w) => ({
        id: w.id,
        raw: (total * w.weight) / totalWeight,
    }));
    for (let i = 0; i < shares.length - 1; i++) {
        const rounded = Math.round(shares[i].raw * 100) / 100;
        result.set(shares[i].id, rounded);
        allocated += rounded;
    }
    const last = shares[shares.length - 1];
    result.set(last.id, Math.round((total - allocated) * 100) / 100);
    return result;
}
function calculateEqualSplit(amount, memberIds) {
    return distributeAmount(amount, memberIds.map((id) => ({ id, weight: 1 })));
}
function calculateRoomBasedSplit(amount, members) {
    if (members.length === 0)
        return new Map();
    const roomGroups = new Map();
    for (const m of members) {
        const key = m.roomId ?? "__unassigned__";
        const list = roomGroups.get(key) ?? [];
        list.push(m.id);
        roomGroups.set(key, list);
    }
    const roomCount = roomGroups.size;
    const perRoom = amount / roomCount;
    const result = new Map();
    for (const [, memberIds] of roomGroups) {
        const roomSplit = calculateEqualSplit(perRoom, memberIds);
        for (const [id, share] of roomSplit) {
            result.set(id, (result.get(id) ?? 0) + share);
        }
    }
    return result;
}
function calculateCustomSplit(amount, customEntries, allMemberIds) {
    const result = new Map();
    let assigned = 0;
    for (const entry of customEntries) {
        if (!allMemberIds.includes(entry.memberId))
            continue;
        const amt = Math.max(0, entry.amount);
        result.set(entry.memberId, amt);
        assigned += amt;
    }
    const remaining = Math.max(0, amount - assigned);
    const remainingMembers = allMemberIds.filter((id) => !result.has(id));
    if (remainingMembers.length > 0 && remaining > 0) {
        const extra = calculateEqualSplit(remaining, remainingMembers);
        for (const [id, share] of extra) {
            result.set(id, share);
        }
    }
    return result;
}
function computeBillSplit(amount, method, members, customEntries = []) {
    const memberIds = members.map((m) => m.id);
    switch (method) {
        case "ROOM_BASED":
            return calculateRoomBasedSplit(amount, members);
        case "CUSTOM":
            return calculateCustomSplit(amount, customEntries, memberIds);
        case "EQUAL":
        default:
            return calculateEqualSplit(amount, memberIds);
    }
}
function calculatePeriodEnd(start, durationType, durationValue, customExpiryDate) {
    if (durationType === "CUSTOM_DATE" && customExpiryDate) {
        return new Date(customExpiryDate);
    }
    const end = new Date(start);
    switch (durationType) {
        case "DAYS":
            end.setDate(end.getDate() + durationValue);
            break;
        case "WEEKS":
            end.setDate(end.getDate() + durationValue * 7);
            break;
        case "MONTHS":
            end.setMonth(end.getMonth() + durationValue);
            break;
        case "YEARS":
            end.setFullYear(end.getFullYear() + durationValue);
            break;
        default:
            end.setMonth(end.getMonth() + 1);
    }
    return end;
}
//# sourceMappingURL=bill-split.js.map