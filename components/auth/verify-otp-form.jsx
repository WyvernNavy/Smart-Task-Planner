"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, Mail } from 'lucide-react'

export function VerifyOTPForm({ email, onVerified, onBackToLogin }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const { verifyOTP, resendOTP } = useAuth()

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await verifyOTP(email, otp)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onVerified()
      }, 2000)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResending(true)

    const result = await resendOTP(email)

    if (result.success) {
      setCanResend(false)
      setCountdown(60)
      setOtp('')
      setError('')
      // Show success message briefly
      const temp = error
      setError('')
      setTimeout(() => setError(''), 3000)
    } else {
      setError(result.error)
    }

    setResending(false)
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Email Verified!</h1>
          <p className="text-muted-foreground">
            Your email has been verified successfully. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">Verify Your Email</h1>
        <p className="text-muted-foreground">
          We've sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            disabled={loading}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
          <p className="text-xs text-muted-foreground text-center">
            Code expires in 10 minutes
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="text-center text-sm">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resending}
            className={`font-medium ${
              canResend
                ? 'text-primary underline-offset-4 hover:underline'
                : 'text-muted-foreground cursor-not-allowed'
            }`}
          >
            {resending ? (
              'Sending...'
            ) : canResend ? (
              'Resend code'
            ) : (
              `Resend in ${countdown}s`
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}
