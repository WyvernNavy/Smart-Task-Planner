import { authenticateRequest } from '@/lib/middleware/auth'
import { clearHistory } from '@/lib/models/history'

export async function DELETE(request) {
  // Authenticate request
  const authResult = await authenticateRequest(request)
  
  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    await clearHistory(authResult.user.id)
    
    return Response.json({ message: 'History cleared successfully' }, { status: 200 })
  } catch (error) {
    console.error('Clear history error:', error)
    return Response.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    )
  }
}
