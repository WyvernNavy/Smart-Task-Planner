import { authenticateRequest } from '@/lib/middleware/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(request, { params }) {
  // Authenticate request
  const authResult = await authenticateRequest(request)
  
  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const { tasks } = await request.json()

    if (!tasks || !Array.isArray(tasks)) {
      return Response.json(
        { error: 'Tasks array is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const taskPlans = db.collection('task_plans')

    // Update the task plan
    const result = await taskPlans.updateOne(
      { 
        _id: new ObjectId(id),
        userId: authResult.user.id // Ensure user owns this task plan
      },
      { 
        $set: { 
          tasks: tasks,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return Response.json(
        { error: 'Task plan not found or unauthorized' },
        { status: 404 }
      )
    }

    return Response.json({ 
      message: 'Task plan updated successfully',
      modifiedCount: result.modifiedCount
    }, { status: 200 })
  } catch (error) {
    console.error('Update task plan error:', error)
    return Response.json(
      { error: error.message || 'Failed to update task plan' },
      { status: 500 }
    )
  }
}
