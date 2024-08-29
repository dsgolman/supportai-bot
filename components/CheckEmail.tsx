'use client'

import { useState } from 'react'
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

export default function CheckEmail() {
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handleResendConfirmationEmail = async () => {
    setResendLoading(true)

    const { error } = await supabase.auth.resendConfirmationEmail()

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      setResendSuccess(true)
      toast({
        title: "Success",
        description: "Confirmation email re-sent successfully!",
        variant: "default",
      })
    }

    setResendLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <Mail className="mr-2 h-6 w-6 text-blue-600" />
            Check Your Email
          </CardTitle>
          <CardDescription className="text-center">
            We've sent you a confirmation email. Please click the link in the email to confirm your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resendSuccess ? (
            <div className="flex items-center justify-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              <p>Confirmation email re-sent successfully!</p>
            </div>
          ) : (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleResendConfirmationEmail} 
              disabled={resendLoading}
            >
              {resendLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend Confirmation Email'
              )}
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}