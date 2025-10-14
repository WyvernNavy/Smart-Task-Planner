import { removeRefreshToken } from '@/lib/models/user'
import { verifyRefreshToken } from '@/lib/jwt'

export async function POST(request) {
  try {
    // Get refresh token from cookie
    const cookieHeader = request.headers.get('cookie')
    const cookies = Object.fromEntries(
      cookieHeader?.split('; ').map(c => c.split('=')) || []
    )
    const refreshToken = cookies.refreshToken

    if (refreshToken) {
      // Verify and remove refresh token
      const decoded = verifyRefreshToken(refreshToken)
      if (decoded) {
        await removeRefreshToken(decoded.userId)
      }
    }

    // Clear cookie
    const response = Response.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    response.headers.set(
      'Set-Cookie',
      'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
    )

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
