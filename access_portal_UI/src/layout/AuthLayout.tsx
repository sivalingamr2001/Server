import type { LoginResponseDto } from "@/api"
import { useAuth } from "@/context/AuthContext"
import useSessionStorage from "@/hooks/useSessionStorage"
import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"

export const AuthLayout = () => {
  const { get } = useSessionStorage()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const UserData: LoginResponseDto | null = get("jan_AP_user")
    if (UserData?.isAuthenticated) {
      navigate("/dashboard")
    }
  }, [currentUser])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full max-w-sm md:max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
