"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

export interface SubjectSummary {
  subject: string;
  candidates: number;
  A1: number;
  B2: number;
  B3: number;
  C4: number;
  C5: number;
  C6: number;
  D7: number;
  E8: number;
  F9: number;
  passPct: number;
  failPct: number;
}

const columns: ColumnDef<SubjectSummary>[] = [
  { accessorKey: "subject", header: "Subject" },
  { accessorKey: "candidates", header: "Candidates" },
  ...["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"].map(
    (grade) => ({ accessorKey: grade, header: grade } as ColumnDef<SubjectSummary>)
  ),
  {
    accessorKey: "passPct",
    header: "% Pass",
    cell: ({ getValue }) => `${getValue<number>().toFixed(1)}%`,
  },
  {
    accessorKey: "failPct",
    header: "% Fail",
    cell: ({ getValue }) => `${getValue<number>().toFixed(1)}%`,
  },
];

interface Props {
  data: SubjectSummary[];
}

export function SubjectSummaryTable({ data }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "passPct", desc: true },
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b bg-muted/50">
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                  onClick={h.column.getToggleSortingHandler()}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: " ↑", desc: " ↓" }[
                    h.column.getIsSorted() as string
                  ] ?? ""}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 text-center text-muted-foreground"
              >
                No subject data — upload results to populate this table
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
