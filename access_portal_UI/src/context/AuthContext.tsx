import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { LoginResponseDto } from "@/api"
import useSessionStorage from "@/hooks/useSessionStorage"

const STORAGE_KEY = "jan_AP_user"

type AuthContextType = {
  currentUser: LoginResponseDto | null
  currentUserRole: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (authData: LoginResponseDto, expireInMinutes?: number) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { get, set, remove } = useSessionStorage()

  const [currentUser, setCurrentUser] = useState<LoginResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const storedUser = get<LoginResponseDto>(STORAGE_KEY)
    if (storedUser) {
      setCurrentUser(storedUser)
    }
    setIsLoading(false)
  }, [get])

  const login = (authData: LoginResponseDto, expireInMinutes = 30) => {
    if (authData.isAuthenticated && authData.currentUser) {
      set(STORAGE_KEY, authData, expireInMinutes)
      setCurrentUser(authData)
    }
  }

  const logout = () => {
    remove(STORAGE_KEY)
    setCurrentUser(null)
  }

  const value = useMemo(
    () => ({
      currentUser,
      currentUserRole: currentUser?.currentUserRole ?? null,
      isAuthenticated: currentUser?.isAuthenticated ?? false,
      isLoading,
      login,
      logout,
    }),
    [currentUser, isLoading]
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
