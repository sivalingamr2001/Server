import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader, // 1. Added shadcn semantic header item wrapper
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"
import { sidebarItems } from "@/lib/config/sidebar-config"
import { roleStringToNumeric } from "@/lib/roleMapper"
import Logo from "@/lib/constants"

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { currentUserRole } = useAuth()

  const { state } = useSidebar()
  const activeRoleNumber: any = roleStringToNumeric(currentUserRole)
  const isCollapsed = state === "collapsed"

  const [hoveredItemTo, setHoveredItemTo] = React.useState<string | null>(null)

const visibleMenuGroups = React.useMemo(() => {
  // Ensure we always treat activeRoleNumber as an array safely
  const userRolesList = Array.isArray(activeRoleNumber)
    ? activeRoleNumber
    : [activeRoleNumber];

  return sidebarItems
    .map((group) => {
      const filteredItems = group.items.filter((item) =>
        // Checks if AT LEAST ONE of the user's roles matches the item's allowed roles
        item.roles.some((roleId) => userRolesList.includes(roleId))
      )
      return { ...group, items: filteredItems }
    })
    // Hide any section headers that end up completely empty
    .filter((group) => group.items.length > 0)
}, [activeRoleNumber])


  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon">
        {/* 3. BRANDING HEADER SECTION */}
        <SidebarHeader
          className={`flex h-16 items-center border-b transition-all duration-200 ${
            isCollapsed ? "justify-center px-0" : "justify-start px-4"
          }`}
        >
          <div className="flex w-full items-center justify-center gap-3 overflow-hidden">
            {/* Dynamic Logo Container Wrapper */}
            <div className="flex w-full items-center justify-center gap-3 overflow-hidden">
              {isCollapsed ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary/5 font-black tracking-wider text-primary">
                  <span className="animate-in text-base font-extrabold duration-300 select-none fade-in">
                    <img
                      src="https://www.janatics.com/public/web/img/favicon.png"
                      alt=""
                      width="20"
                    />
                  </span>
                </div>
              ) : (
                /* 2. Show the full image logo asset when sidebar is fully open */
                <div className="mt-1 flex rounded bg-primary/5 p-2 font-black tracking-wider text-primary">
                  <img
                    src={Logo}
                    alt="JANATICS"
                    className="h-6 w-auto animate-in object-contain object-left duration-300 fade-in"
                  />
                </div>
              )}
            </div>
          </div>
        </SidebarHeader>

        {/* LINKS NAVIGATION PANEL */}
        <SidebarContent>
          <SidebarMenu onMouseLeave={() => setHoveredItemTo(null)}>
            {visibleMenuGroups.map((group) => (
              <SidebarGroup key={group.title} className="px-2">
                {!isCollapsed && (
                  <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/70">
                    {group.title}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  {group.items.map((item) => {
                    const isActive = pathname === item.to
                    const Icon = item.icon

                    const menuItemButton = (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="relative bg-transparent text-muted-foreground transition-colors duration-200 hover:bg-transparent hover:text-foreground data-[active=true]:bg-transparent data-[active=true]:text-primary-foreground"
                      >
                        <Link
                          to={item.to}
                          className="z-10 flex w-full items-center"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="ml-3 transition-opacity duration-200">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    )

                    return (
                      <SidebarMenuItem
                        key={item.to}
                        className="relative my-0.5"
                        onMouseEnter={() => setHoveredItemTo(item.to)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeBackground"
                            className="absolute inset-0 rounded-md bg-primary"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}

                        <AnimatePresence>
                          {hoveredItemTo === item.to && !isActive && (
                            <motion.div
                              layoutId="hoverBackground"
                              className="absolute inset-0 rounded-md bg-accent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 32,
                              }}
                            />
                          )}
                        </AnimatePresence>

                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="w-full">{menuItemButton}</div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              align="center"
                              className="font-medium"
                            >
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          menuItemButton
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  )
}

export default AppSidebar
