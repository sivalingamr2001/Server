import { Outlet } from "react-router-dom"
import AppSidebar from "./AppSidebar"
import {AppHeader} from "./AppHeader"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />

        <SidebarInset className="flex flex-col overflow-hidden">
          <AppHeader />

          <main className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full min-h-0 overflow-hidden rounded-4xl bg-sidebar p-6 shadow-lg">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
