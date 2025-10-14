import { authenticateRequest } from '@/lib/middleware/auth'
import { getHistory } from '@/lib/models/history'

export async function GET(request) {
  // Authenticate request
  const authResult = await authenticateRequest(request)
  
  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const history = await getHistory(authResult.user.id)
    
    return Response.json({ history }, { status: 200 })
  } catch (error) {
    console.error('Get history error:', error)
    return Response.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
