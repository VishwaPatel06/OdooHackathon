"use client"

import type React from "react"

import { useState } from "react"
import { Topbar } from "@/components/dashboard/topbar"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <Topbar onMenuClick={() => setOpen(true)} />
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex">
          <Sidebar open={open} onClose={() => setOpen(false)} />
          <main className="flex-1 px-4 md:px-6 py-6 md:py-8 md:pl-8">
            <div className="hidden md:block h-2" />
            {children}
            <div className="h-10" />
          </main>
        </div>
      </div>
    </div>
  )
}
