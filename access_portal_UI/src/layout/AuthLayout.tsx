import { Outlet } from "react-router-dom"

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  )
}
