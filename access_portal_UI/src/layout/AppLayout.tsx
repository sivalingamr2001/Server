import { Outlet } from "react-router-dom"
import AppSidebar from "./AppSidebar"
import AppHeader from "./AppHeader"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />

        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader />

          <main className="flex-1 overflow-y-auto p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
