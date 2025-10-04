"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, LogOut, Settings, User } from "lucide-react"

type TopbarProps = {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="md:hidden inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm"
        >
          {"≡"}
        </button>

        {/* Brand */}
        <Link href="/" className="ml-1 md:ml-0 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary" aria-hidden />
          <span className="font-semibold">xpensify</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex bg-transparent">
            Logout
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                aria-label="Open profile menu"
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-xs">UN</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <User className="mr-2 size-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 size-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
