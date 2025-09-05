"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { CopyCell } from "@/components/ui/copy-cell";
import { StatusCell } from "@/components/ui/status-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { useDataTable } from "@/hooks/use-data-table";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { DispatchType } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";

interface DispatchTypesTableProps {
  preloaded: Preloaded<typeof api.customization.paginatedDispatchTypes>;
}

export function DispatchTypesTable({ preloaded }: DispatchTypesTableProps) {
  const data = usePreloadedQuery(preloaded);
  
  const columns = useMemo<ColumnDef<DispatchType>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => {
          return <CopyCell value={row.original.code} />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "group",
        header: "Group",
        cell: ({ row }) => {
          return (
            <StatusCell 
              status={row.original.group} 
              variant="dispatch"
              statusType={row.original.group}
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const name = row.original.name;
          return (
            <Cell>
              <CellContent>{name || "No name"}</CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "_creationTime",
        header: "Created At",
        cell: ({ row }) => {
          return (
            <TimestampCell 
              timestamp={row.original._creationTime} 
              format="short-12h" 
            />
          );
        },
        sortDescFirst: true,
        meta: {
          variant: "number",
        },
      },
    ],
    [],
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