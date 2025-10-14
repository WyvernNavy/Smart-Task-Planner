import { verifyOTP } from '@/lib/models/user'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    // Validation
    if (!email || !otp) {
      return Response.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Verify OTP
    await verifyOTP(email.toLowerCase(), otp)

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email).catch(err => 
      console.error('Failed to send welcome email:', err)
    )

    return Response.json(
      { message: 'Email verified successfully. You can now log in.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('OTP verification error:', error)
    
    if (error.message === 'User not found') {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (error.message === 'User already verified') {
      return Response.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    if (error.message === 'Invalid OTP') {
      return Response.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    if (error.message === 'OTP expired') {
      return Response.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
