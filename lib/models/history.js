import { getDatabase } from '../mongodb'
import { ObjectId } from 'mongodb'

async function getTaskPlansCollection() {
  const db = await getDatabase()
  return db.collection('task_plans')
}

export async function createHistory(userId, userEmail, goal, tasks) {
  const taskPlans = await getTaskPlansCollection()
  
  const taskPlan = {
    userId,
    userEmail,
    goal,
    tasks,
    createdAt: new Date(),
  }

  const result = await taskPlans.insertOne(taskPlan)
  
  return {
    ...taskPlan,
    _id: result.insertedId
  }
}

export async function getHistory(userId) {
  const taskPlans = await getTaskPlansCollection()
  
  // Fetch all task plans for this user, sorted by most recent first
  const history = await taskPlans
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
  
  return history
}

export async function deleteHistory(userId, taskPlanId) {
  const taskPlans = await getTaskPlansCollection()
  
  const result = await taskPlans.deleteOne({
    _id: new ObjectId(taskPlanId),
    userId // Ensure user can only delete their own task plans
  })

  if (result.deletedCount === 0) {
    throw new Error('Task plan not found or unauthorized')
  }

  return true
}

export async function clearHistory(userId) {
  const taskPlans = await getTaskPlansCollection()
  
  await taskPlans.deleteMany({ userId })

  return true
}
