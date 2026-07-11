import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Loader } from "@/components/Loader"
import { useAuth } from "@/context/AuthContext"

export const ProtectedRoute = () => {
  const { isAuthenticated, currentUser } = useAuth()

  const location = useLocation()

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
