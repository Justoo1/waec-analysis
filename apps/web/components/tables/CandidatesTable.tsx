"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

export interface Candidate {
  indexNumber: string;
  fullName: string;
  gender: string | null;
  programme: string | null;
  totalPasses: number;
  qualifiesUniversity: boolean;
  bestSixAggregate: number | null;
}

const columns: ColumnDef<Candidate>[] = [
  { accessorKey: "indexNumber", header: "Index No." },
  { accessorKey: "fullName", header: "Name" },
  { accessorKey: "gender", header: "Gender" },
  { accessorKey: "programme", header: "Programme" },
  { accessorKey: "totalPasses", header: "Passes" },
  {
    accessorKey: "qualifiesUniversity",
    header: "Qualifies",
    cell: ({ getValue }) => (getValue<boolean>() ? "✅" : "❌"),
  },
  {
    accessorKey: "bestSixAggregate",
    header: "Best-6 Agg.",
    cell: ({ getValue }) => getValue<number | null>() ?? "—",
  },
];

interface Props {
  data: Candidate[];
}

export function CandidatesTable({ data }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-3">
      <input
        placeholder="Search candidates…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
      />

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="cursor-pointer select-none px-4 py-2 text-left text-xs font-medium text-muted-foreground"
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
                  No candidates found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {table.getFilteredRowModel().rows.length} candidates
      </p>
    </div>
  );
}
