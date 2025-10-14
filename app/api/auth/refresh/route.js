import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt'
import { findUserById } from '@/lib/models/user'

export async function POST(request) {
  try {
    // Get refresh token from cookie
    const cookieHeader = request.headers.get('cookie')
    const cookies = Object.fromEntries(
      cookieHeader?.split('; ').map(c => c.split('=')) || []
    )
    const refreshToken = cookies.refreshToken

    if (!refreshToken) {
      return Response.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    
    if (!decoded) {
      return Response.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Verify user exists and token matches
    const user = await findUserById(decoded.userId)
    
    if (!user || user.refreshToken !== refreshToken) {
      return Response.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId, decoded.email)

    return Response.json(
      { accessToken },
      { status: 200 }
    )
  } catch (error) {
    console.error('Token refresh error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
