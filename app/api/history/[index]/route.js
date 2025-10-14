import { authenticateRequest } from '@/lib/middleware/auth'
import { deleteHistory } from '@/lib/models/history'

export async function DELETE(request, { params }) {
  // Authenticate request
  const authResult = await authenticateRequest(request)
  
  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const { index } = await params
    const taskPlanId = index // This is actually the task plan _id

    if (!taskPlanId) {
      return Response.json(
        { error: 'Invalid task plan ID' },
        { status: 400 }
      )
    }

    await deleteHistory(authResult.user.id, taskPlanId)
    
    return Response.json({ message: 'History deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Delete history error:', error)
    return Response.json(
      { error: error.message || 'Failed to delete history' },
      { status: 500 }
    )
  }
}
