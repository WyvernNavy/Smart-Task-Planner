"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { VerifyOTPForm } from '@/components/auth/verify-otp-form'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/planner/theme-toggle'
import { Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [activeView, setActiveView] = useState('login')
  const [verifyingEmail, setVerifyingEmail] = useState(null)
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  const handleSignupSuccess = (email) => {
    setVerifyingEmail(email)
  }

  const handleVerified = () => {
    setVerifyingEmail(null)
    setActiveView('login')
  }

  const handleBackToLogin = () => {
    setVerifyingEmail(null)
    setActiveView('login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-6">
          {verifyingEmail ? (
            <VerifyOTPForm
              email={verifyingEmail}
              onVerified={handleVerified}
              onBackToLogin={handleBackToLogin}
            />
          ) : activeView === 'login' ? (
            <LoginForm onSwitchToSignup={() => setActiveView('signup')} />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setActiveView('login')}
              onSignupSuccess={handleSignupSuccess}
            />
          )}
        </CardContent>
      </Card>

      <div className="absolute bottom-4 text-center w-full">
        <p className="text-sm text-muted-foreground">
          Smart Task Planner with Gemini AI
        </p>
      </div>
    </div>
  )
}
