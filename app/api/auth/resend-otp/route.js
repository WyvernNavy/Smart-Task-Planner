import { resendOTP } from '@/lib/models/user'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate and send new OTP
    const otp = await resendOTP(email.toLowerCase())
    await sendOTPEmail(email, otp)

    return Response.json(
      { message: 'OTP sent successfully. Please check your email.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend OTP error:', error)
    
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

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
