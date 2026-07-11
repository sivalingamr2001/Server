import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Bell, Check, Circle } from "lucide-react"
import React from "react"
import { useNavigate } from "react-router-dom"

// Mock interface to replace missing API types
interface NotificationItem {
  auditId: number
  accessReqId: number
  isRead: boolean
  eventType: string
  createdOn: string
  message: string
}

// Temporary static array replacing the API state
const mockNotifications: NotificationItem[] = [
  {
    auditId: 1,
    accessReqId: 101,
    isRead: false,
    eventType: "Access Request",
    createdOn: new Date().toISOString(),
    message: "John Doe requested production DB access.",
  },
  {
    auditId: 2,
    accessReqId: 102,
    isRead: true,
    eventType: "System Log",
    createdOn: new Date().toISOString(),
    message: "Automated cleanup task completed successfully.",
  }
]

export const NotificationSheet: React.FC = () => {
  const navigate = useNavigate()

  // Use the local mock data
  const notifications = mockNotifications
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleNotificationClick = (auditId: number) => {
    const targetNotification = notifications.find(n => n.auditId === auditId)
    const requestId = targetNotification?.accessReqId || 0
    navigate(`/request/${requestId}`)
  }

  return (
    <SheetContent side="right" className="flex h-full flex-col">
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {unreadCount} new
            </span>
          )}
        </SheetTitle>
        <SheetDescription>
          Stay updated with your enterprise automation logs.
        </SheetDescription>
      </SheetHeader>

      {/* Content Area */}
      <div className="flex-1 space-y-3 overflow-y-auto m-2">
        {notifications.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
            No new notifications at this time.
          </div>
        )}

        {notifications.map((notification) => (
          <SheetClose asChild key={notification.auditId}>
            <div
              onClick={() => handleNotificationClick(notification.auditId)}
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${notification.isRead
                ? "bg-background opacity-70 hover:bg-accent/40"
                : "border-accent bg-accent/30 hover:bg-accent/60"
                }`}
            >
              <div className="mt-1 shrink-0">
                {notification.isRead ? (
                  <Check className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Circle className="h-4 w-4 animate-pulse fill-primary text-primary" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${notification.isRead ? "text-foreground/80" : "text-foreground"
                      }`}
                  >
                    {notification.eventType || "Log Update"}
                  </p>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {notification.createdOn
                      ? new Date(notification.createdOn).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )
                      : "Recent"}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            </div>
          </SheetClose>
        ))}
      </div>
    </SheetContent>
  )
}
