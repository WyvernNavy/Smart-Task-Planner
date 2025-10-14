import { findUserByEmail, verifyPassword, updateRefreshToken } from '@/lib/models/user'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'

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

    // Find user
    const user = await findUserByEmail(email.toLowerCase())
    
    if (!user) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is verified
    if (!user.isVerified) {
      return Response.json(
        { error: 'Email not verified. Please verify your email first.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const userId = user._id.toString()
    const accessToken = generateAccessToken(userId, user.email)
    const refreshToken = generateRefreshToken(userId, user.email)

    // Store refresh token
    await updateRefreshToken(userId, refreshToken)

    // Set refresh token as httpOnly cookie
    const response = Response.json(
      {
        message: 'Login successful',
        accessToken,
        user: {
          id: userId,
          email: user.email,
          isVerified: user.isVerified
        }
      },
      { status: 200 }
    )

    response.headers.set(
      'Set-Cookie',
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    )

    return response
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
