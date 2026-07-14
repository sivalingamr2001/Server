import loginApi, { type LoginRequestDto } from "@/api/loginApi"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import Logo from "@/lib/constants"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { withLoader, loading } = useLoader()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)

    await handleLogin({ identifier, password })
  }

  const handleLogin = async (credentials: LoginRequestDto) => {
    try {
      const response: any = await withLoader(() =>
        loginApi.getCurrentUserProfile(credentials)
      )

      if (response && response.isAuthenticated) {
        login(response, 45)
        toast.success("Login successful!")
        navigate("/dashboard", { replace: true })
      } else {
        setErrorMsg("Invalid username or password. Please try again.")
      }
    } catch (error) {
      console.error("Login failed", error)
      setErrorMsg("An unexpected connection error occurred. Please try again.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <div className="flex items-center justify-center bg-muted p-4">
            <img
              src={Logo}
              alt="JANATICS"
              className="h-12 w-auto object-contain"
            />
          </div>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 3. Changed onSubmit target to your new domestic submit utility */}
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="identifier">Username or Email</FieldLabel>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Username/Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>

              {errorMsg && (
                <div className="rounded bg-destructive/10 p-2 text-sm font-medium text-destructive">
                  {errorMsg}
                </div>
              )}

              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
