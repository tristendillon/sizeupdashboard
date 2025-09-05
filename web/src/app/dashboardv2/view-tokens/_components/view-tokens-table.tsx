"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { useFormatter } from "@/utils/timestamp";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { ViewToken } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";

interface ViewTokensTableProps {
  preloaded: Preloaded<typeof api.viewToken.paginatedViewTokens>;
}

export function ViewTokensTable({ preloaded }: ViewTokensTableProps) {
  const data = usePreloadedQuery(preloaded);
  console.log(data);
  const { format: formatTimestamp, isHydrated } = useFormatter("short-12h");
  const columns = useMemo<ColumnDef<ViewToken>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: false,
      },
      {
        accessorKey: "token",
        header: "Token",
        enableSorting: false,
        cell: ({ row }) => {
          const token = row.original.token;
          const handleCopy = async () => {
            try {
              await navigator.clipboard.writeText(token);
            } catch (e) {
              // fallback or error handling if needed
            }
          };
          return (
            <div className="flex items-center gap-2">
              <span className="max-w-[180px] truncate">{token}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded border bg-zinc-100 px-2 py-1 text-xs hover:bg-zinc-200"
                title="Copy token"
              >
                Copy
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: "_creationTime",
        header: "Created At",
        cell: ({ row }) => {
          const formattedTime = formatTimestamp(row.original._creationTime);
          if (isHydrated) {
            return <div>{formattedTime}</div>;
          }
        },
        sortDescFirst: true,
        meta: {
          variant: "number",
        },
      },
    ],
    [formatTimestamp, isHydrated],
  );

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount: data.pagination.totalPages,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "_creationTime", desc: true }],
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}
