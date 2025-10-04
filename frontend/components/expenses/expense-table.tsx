"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useExpenses } from "@/lib/expenses-store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const statusColor: Record<string, string> = {
  Pending: "bg-blue-100 text-blue-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Draft: "bg-muted text-foreground",
}

export default function ExpenseTable() {
  const { data = [] } = useExpenses()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const pageSize = 8

  const pages = Math.max(1, Math.ceil(data.length / pageSize))
  const rows = useMemo(() => data.slice((page - 1) * pageSize, page * pageSize), [data, page])

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id} className="cursor-pointer" onClick={() => router.push(`/expenses/${e.id}`)}>
                <TableCell className="font-medium">{e.description}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {e.currency} {e.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${statusColor[e.status]}`}
                  >
                    {e.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No expenses yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
            </PaginationItem>
            <PaginationItem className="px-3 text-sm">
              {page} / {pages}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => setPage((p) => Math.min(pages, p + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
