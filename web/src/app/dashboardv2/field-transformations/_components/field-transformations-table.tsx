"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { StatusCell } from "@/components/ui/status-cell";
import { JsonCell } from "@/components/ui/json-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { useDataTable } from "@/hooks/use-data-table";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { FieldTransformation } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";

interface FieldTransformationsTableProps {
  preloaded: Preloaded<typeof api.transformations.paginatedFieldTransformations>;
}

export function FieldTransformationsTable({ preloaded }: FieldTransformationsTableProps) {
  const data = usePreloadedQuery(preloaded);
  
  const columns = useMemo<ColumnDef<FieldTransformation>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return (
            <Cell>
              <CellContent className="font-medium">{row.original.name}</CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "field",
        header: "Field",
        cell: ({ row }) => {
          return (
            <Cell>
              <CellContent className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                {row.original.field}
              </CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "strategy",
        header: "Strategy",
        cell: ({ row }) => {
          const strategyLabels = {
            static_value: "Static Value",
            random_offset: "Random Offset", 
            random_string: "Random String",
            merge_data: "Merge Data",
          };
          
          const strategy = row.original.strategy;
          const label = strategyLabels[strategy] || strategy;
          
          return <StatusCell status={label} variant="custom" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "params",
        header: "Parameters",
        cell: ({ row }) => {
          return (
            <JsonCell 
              data={row.original.params}
              maxPreviewKeys={1}
            />
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