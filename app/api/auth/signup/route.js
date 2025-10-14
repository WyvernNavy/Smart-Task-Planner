import { createUser } from '@/lib/models/user'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password length validation
    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email.toLowerCase(), password)

    // Send OTP email
    await sendOTPEmail(email, user.otp)

    return Response.json(
      {
        message: 'User created successfully. Please check your email for OTP.',
        email: user.email
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error.message === 'User already exists') {
      return Response.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
