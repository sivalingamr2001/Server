import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, LogOut, User, User2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

export function AppHeader() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="flex h-10 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9" />
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline-block">
            Access Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-2 h-2 w-2 animate-pulse rounded-full bg-destructive" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-100 sm:w-135">
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                Stay updated with your enterprise automation logs.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
              No new notifications at this time.
            </div>
          </SheetContent>
        </Sheet>

        <div className="h-5 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <User2 className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="mt-1 w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="truncate text-sm leading-none font-medium text-foreground">
                  {currentUser?.currentUser?.cmpL_USER_NAME || "User Name"}
                </p>
                <p className="truncate text-xs leading-none font-normal text-muted-foreground">
                  {currentUser?.currentUser?.maiL_ID || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default AppHeader
