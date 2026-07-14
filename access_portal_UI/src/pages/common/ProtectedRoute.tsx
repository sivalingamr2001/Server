import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Loader } from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"
import type { LoginResponseDto } from "@/api"
import useSessionStorage from "@/hooks/useSessionStorage"
import { useEffect } from "react"

export const ProtectedRoute = () => {
  const { isAuthenticated, currentUser } = useAuth()
  const { get } = useSessionStorage()
  const navigate = useNavigate()

  const location = useLocation()

  useEffect(() => {
    const UserData: LoginResponseDto | null = get("jan_AP_user")
    if (UserData?.isAuthenticated) {
      navigate("/dashboard")
    }
  }, [currentUser])

  if (currentUser === undefined) {
    return <Loader />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    )
  }

  return <Outlet />
}
