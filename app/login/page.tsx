import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MailIcon } from 'lucide-react'
import Link from 'next/link'
import { login, signup } from "./actions"
import { PasswordInput } from "@/components/ui/password-input"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to Daily Dose</CardTitle>
          <CardDescription className="text-center">
            Log in or sign up to access your health companion
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  placeholder="m@example.com"
                  type="email"
                  className="pl-10"
                  required
                />
                <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex space-x-4 w-full">
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                formAction={login}
              >
                Log in
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                formAction={signup}
              >
                Sign up
              </Button>
            </div>
            <div className="flex justify-center w-full text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}