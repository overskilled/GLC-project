"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/store/auth-store"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      // Mock authentication - in production, this would call an API
      const mockUsers = [
        { email: "admin@example.com", password: "admin123", role: "admin" as const, name: "Admin User" },
        { email: "finance@example.com", password: "finance123", role: "finance" as const, name: "Finance Manager" },
        { email: "product@example.com", password: "product123", role: "product" as const, name: "Product Manager" },
      ]

      const user = mockUsers.find((u) => u.email === data.email && u.password === data.password)

      if (user) {
        login({
          id: "1",
          email: user.email,
          name: user.name,
          role: user.role,
        })
        toast.success(`Bienvenue ${user.name}`)
        router.push("/dashboard")
      } else {
        toast.error("Email ou mot de passe incorrect")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="admin@example.com" {...register("email")} disabled={isLoading} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} disabled={isLoading} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion..." : "Se connecter"}
      </Button>

      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-2">Comptes de test :</p>
        <ul className="space-y-1 text-xs">
          <li>Admin: admin@example.com / admin123</li>
          <li>Finance: finance@example.com / finance123</li>
          <li>Produit: product@example.com / product123</li>
        </ul>
      </div>
    </form>
  )
}
