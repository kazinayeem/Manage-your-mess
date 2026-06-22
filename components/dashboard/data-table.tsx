"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { EnhancedDataTable } from "@/components/dashboard/enhanced-data-table";

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchPlaceholder?: string;
  exportFilename?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Backward-compatible wrapper — delegates to EnhancedDataTable with search, sort, pagination, CSV export. */
export function DataTable<T>(props: DataTableProps<T>) {
  return <EnhancedDataTable {...props} />;
}

export { EnhancedDataTable } from "@/components/dashboard/enhanced-data-table";
