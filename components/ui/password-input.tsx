'use client'

import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react'

interface PasswordInputProps {
  id: string;
  name: string;
}

export function PasswordInput({ id, name }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        className="pl-10 pr-10"
        required
      />
      <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
      >
        {showPassword ? (
          <EyeOffIcon className="h-5 w-5" />
        ) : (
          <EyeIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  )
}