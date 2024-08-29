'use client'

import { Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmail() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <Mail className="mr-2 h-6 w-6 text-blue-600" />
            Check Your Email
          </CardTitle>
          <CardDescription className="text-center">
            We sent you a confirmation email. Please click the link in the email to confirm your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            If you do not see the email, please check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Still did not receive the email? Contact support.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
