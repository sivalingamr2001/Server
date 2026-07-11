import { sidebarItems } from "./config/sidebar-config"

/**
 * Get title and description from sidebar config based on route
 */
export function getTitleFromSidebar(route: string) {
  for (const group of sidebarItems) {
    const item = group.items.find((item) => item.to === route)
    if (item) {
      return {
        title: item.label,
        description: item.desc || "",
      }
    }
  }

  return {
    title: "Data Table",
    description: "",
  }
}
