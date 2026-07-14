import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/context/theme-provider.tsx"
import App from "./App.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"
import { AuthProvider } from "./context/AuthContext.tsx"
import "./index.css"
import { SidebarProvider } from "./components/ui/sidebar.tsx"
import { AllCommunityModule } from "ag-grid-community"
import { AgGridProvider } from "ag-grid-react"
import { Toaster } from "./components/ui/sonner.tsx"

const modules = [AllCommunityModule]

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster position="top-right" richColors />
        <SidebarProvider>
          <AuthProvider>
            <AgGridProvider modules={modules}>
              <App />
            </AgGridProvider>
          </AuthProvider>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
