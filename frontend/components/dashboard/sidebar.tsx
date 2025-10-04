"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FileText, LayoutDashboard, LineChart, Receipt, Settings, Users, Wallet, ScanText } from "lucide-react"
import { useEffect } from "react"
import { usePendingCount } from "@/lib/expenses-store"

type SidebarProps = {
  open: boolean
  onClose: () => void
}

const itemsBase = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Expenses", icon: Wallet, href: "/expenses" },
  { label: "Reports", icon: FileText, href: "/reports" },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Analytics", icon: LineChart, href: "/analytics" },
  { label: "Scan (OCR)", icon: ScanText, href: "/scan-ocr" },
  { label: "Company Settings", icon: Settings, href: "/company-settings" },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  // Close on escape for accessibility
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const pathname = usePathname()
  const { data: pending = 0 } = usePendingCount()

  const items = [
    itemsBase[0],
    itemsBase[1],
    { label: "Exprovals", icon: Receipt, href: "/exprovals", badge: pending > 0 ? String(pending) : undefined },
    ...itemsBase.slice(2),
  ]

  return (
    <>
      {/* Mobile overlay */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed z-50 md:z-10 md:static inset-y-0 left-0 w-72 md:w-60 bg-sidebar text-sidebar-foreground border-r",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Primary"
      >
        <div className="h-16 md:h-[72px]" />
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100dvh-72px)]">
          {items.map(({ label, icon: Icon, badge, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={label}
                href={href}
                onClick={onClose}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent",
                  isActive && "bg-sidebar-accent",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden />
                <span className="truncate">{label}</span>
                {badge && (
                  <Badge className="ml-auto" variant="secondary">
                    {badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
