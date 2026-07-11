import { NotificationSheet } from "@/components/NotificationSheet"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import { Bell, LogOut, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

export const AppHeader = () => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9" />
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-3">
          <span className="hidden text-md font-medium text-muted-foreground sm:inline-block">
            {"Folder Access Portal"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* NOTIFICATIONS PANEL */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          {/* This component handles its own display data natively now */}
          <NotificationSheet />
        </Sheet>

        <div className="h-5 w-px bg-border" />

        {/* USER DROPDOWN MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto items-center gap-3 rounded-lg p-1 transition-colors hover:bg-accent/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-accent text-accent-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden flex-col items-start gap-0.5 text-left text-xs sm:flex">
                <span className="font-medium max-w-[120px] truncate text-foreground">
                  {currentUser?.user?.displayName || "System User"}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {currentUser?.user?.role || "Guest"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
