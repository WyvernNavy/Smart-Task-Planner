import { verifyAccessToken } from '../jwt'
import { findUserById } from '../models/user'

export async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'No token provided' }
  }

  const token = authHeader.substring(7)
  const decoded = verifyAccessToken(token)

  if (!decoded) {
    return { authenticated: false, error: 'Invalid or expired token' }
  }

  // Verify user still exists and is verified
  const user = await findUserById(decoded.userId)
  
  if (!user) {
    return { authenticated: false, error: 'User not found' }
  }

  if (!user.isVerified) {
    return { authenticated: false, error: 'Email not verified' }
  }

  return {
    authenticated: true,
    user: {
      id: user._id.toString(),
      email: user.email,
      isVerified: user.isVerified
    }
  }
}

export function createAuthMiddleware(handler) {
  return async (request, context) => {
    const authResult = await authenticateRequest(request)

    if (!authResult.authenticated) {
      return Response.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    // Attach user to request for use in handler
    request.user = authResult.user

    return handler(request, context)
  }
}
