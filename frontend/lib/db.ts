import { apiPost } from "@/lib/server-api";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function reviveDates(value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) return new Date(value);
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = reviveDates(v);
    return out;
  }
  return value;
}

function toPrismaModelName(prop: string): string {
  return prop.charAt(0).toUpperCase() + prop.slice(1);
}

function createModelProxy(modelName: string) {
  const prismaModel = toPrismaModelName(modelName);
  return {
    findMany: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "findMany", args });
      return res.success ? reviveDates(res.data) : [];
    },
    findUnique: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "findUnique", args });
      return res.success ? reviveDates(res.data) : null;
    },
    findFirst: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "findFirst", args });
      return res.success ? reviveDates(res.data) : null;
    },
    count: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "count", args });
      return res.success ? res.data : 0;
    },
    aggregate: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "aggregate", args });
      return res.success ? reviveDates(res.data) : {};
    },
    groupBy: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "groupBy", args });
      return res.success ? reviveDates(res.data) : [];
    },
    createMany: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "createMany", args });
      return res.success ? res.data : { count: 0 };
    },
    deleteMany: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "deleteMany", args });
      return res.success ? res.data : { count: 0 };
    },
    update: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "update", args });
      return res.success ? reviveDates(res.data) : null;
    },
    create: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "create", args });
      return res.success ? reviveDates(res.data) : null;
    },
    delete: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "delete", args });
      return res.success ? reviveDates(res.data) : null;
    },
    upsert: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "upsert", args });
      return res.success ? reviveDates(res.data) : null;
    },
    updateMany: async (args?: any) => {
      const res = await apiPost("/query", { model: prismaModel, action: "updateMany", args });
      return res.success ? res.data : null;
    },
  };
}

export const db = new Proxy({}, {
  get: (target, prop: string) => {
    return createModelProxy(prop);
  }
}) as any;