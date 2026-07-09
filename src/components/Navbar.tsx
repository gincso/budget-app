"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  Landmark,
  BarChart3,
  Users,
  FileText,
  Tag,
  Settings,
  ChevronLeft,
  PanelLeft,
  LogOut,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useStore } from "@/store/useStore"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/family", label: "Family", icon: Users },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/settings", label: "Settings", icon: Settings },
]

function NavLink({
  href,
  icon: Icon,
  label,
  collapsed,
  onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  collapsed?: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

function SidebarContent({
  collapsed,
  onNavClick,
}: {
  collapsed?: boolean
  onNavClick?: () => void
}) {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 items-center border-b px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">B</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold">BudgetApp</span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      <div className={cn("p-3", collapsed && "flex justify-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex w-full items-center gap-2 p-2",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? ""} />
                <AvatarFallback>
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-1 flex-col items-start text-left text-sm">
                  <span className="font-medium">{user?.name ?? "User"}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    {user?.email ?? ""}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="w-56"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name ?? "User"}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Navbar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useStore()

  return (
    <>
      {/* Mobile sheet */}
      <Sheet open={!sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-3 z-40 lg:hidden"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen flex-col border-r bg-background transition-all duration-300",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        <div className="flex h-14 items-center justify-end px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronIcon collapsed={sidebarOpen} />
          </Button>
        </div>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>
    </>
  )
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <ChevronDownOrLeft collapsed={collapsed} />
  )
}

function ChevronDownOrLeft({ collapsed }: { collapsed: boolean }) {
  return collapsed ? (
    <Chevron className="h-4 w-4" />
  ) : (
    <Chevron className="h-4 w-4 rotate-180" />
  )
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}