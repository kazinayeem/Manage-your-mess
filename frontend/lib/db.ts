import { PrismaClient } from "@prisma/client";
import { apiPost } from "@/lib/api-client";

function createModelProxy(modelName: string) {
  return {
    findMany: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "findMany", args });
      return res.success ? res.data : [];
    },
    findUnique: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "findUnique", args });
      return res.success ? res.data : null;
    },
    findFirst: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "findFirst", args });
      return res.success ? res.data : null;
    },
    count: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "count", args });
      return res.success ? res.data : 0;
    },
    aggregate: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "aggregate", args });
      return res.success ? res.data : {};
    },
    update: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "update", args });
      return res.success ? res.data : null;
    },
    create: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "create", args });
      return res.success ? res.data : null;
    },
    delete: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "delete", args });
      return res.success ? res.data : null;
    },
    upsert: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "upsert", args });
      return res.success ? res.data : null;
    },
    updateMany: async (args: any) => {
      const res = await apiPost("/query", { model: modelName, action: "updateMany", args });
      return res.success ? res.data : null;
    },
  };
}

export const db = new Proxy({}, {
  get: (target, prop: string) => {
    return createModelProxy(prop);
  }
}) as unknown as PrismaClient;
