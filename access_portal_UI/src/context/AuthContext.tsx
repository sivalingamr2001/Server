import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import useSessionStorage from "@/hooks/useSessionStorage"
import type { PortalUserDetails } from "@/api/types"

const STORAGE_KEY = "jan_AP_user"

type AuthContextType = {
  currentUser: PortalUserDetails | null
  currentUserRole: string | null
  isAuthenticated: boolean
  login: (user: any, expireInMinutes?: number) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { get, set, remove } = useSessionStorage()

  const [currentUser, setCurrentUser] = useState<any | null>(undefined)

  useEffect(() => {
    const user = get(STORAGE_KEY)

    setCurrentUser(user)
  }, [get])

  const login = (user: any, expireInMinutes = 30) => {
    set(STORAGE_KEY, user, expireInMinutes)

    setCurrentUser(user)
  }

  const logout = () => {
    remove(STORAGE_KEY)

    setCurrentUser(null)
  }

  const value = useMemo(
    () => ({
      currentUser,

      currentUserRole: (() => {
        const rawRole = currentUser?.user?.role;
        if (!rawRole) return [];
        try {
          return typeof rawRole === "string" ? JSON.parse(rawRole) : rawRole;
        } catch (e) {
          return [rawRole];
        }
      })(),

      isAuthenticated: !!currentUser,

      login,

      logout,
    }),
    [currentUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}
