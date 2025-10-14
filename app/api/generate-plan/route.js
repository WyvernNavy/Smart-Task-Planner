import { GoogleGenerativeAI } from '@google/generative-ai'
import { authenticateRequest } from '@/lib/middleware/auth'
import { createHistory } from '@/lib/models/history'

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not configured in environment variables')
}

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

export async function POST(request) {
  // Authenticate request
  const authResult = await authenticateRequest(request)
  
  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: 401 }
    )
  }

  try {
    const { goal } = await request.json()

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return Response.json(
        { error: 'Goal is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Check if Gemini API is configured
    if (!genAI) {
      console.error('Gemini API not configured, returning mock data')
      // Return mock data if API key not configured
      const mock = [
        { task: "Market research", duration: "2 days", depends_on: null },
        { task: "Finalize product design", duration: "3 days", depends_on: "Market research" },
        { task: "Set up landing page", duration: "2 days", depends_on: "Market research" },
        { task: "Marketing plan & assets", duration: "4 days", depends_on: "Finalize product design" },
        { task: "Launch & feedback", duration: "1 week", depends_on: "Set up landing page" },
      ]
      return Response.json(mock, { status: 200 })
    }

    // Using the correct model name for the current API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a task planning assistant. Break down the following goal into actionable tasks with estimated durations and dependencies.

Goal: "${goal}"

IMPORTANT: Return ONLY a valid JSON array with this exact structure (no markdown, no code blocks, no explanations):
[
  {
    "task": "Task name",
    "duration": "X days/weeks/hours",
    "depends_on": null or "Previous task name"
  }
]

Requirements:
1. Return 4-8 tasks
2. Duration should be realistic (e.g., "2 days", "1 week", "4 hours")
3. Use depends_on to show task dependencies (null for tasks with no dependencies)
4. depends_on should reference the exact task name from the array
5. Tasks should be in logical order
6. Be specific and actionable
7. Return ONLY the JSON array, nothing else

Example for "Launch a mobile app":
[
  {"task": "Market research", "duration": "3 days", "depends_on": null},
  {"task": "Design app UI/UX", "duration": "1 week", "depends_on": "Market research"},
  {"task": "Develop core features", "duration": "2 weeks", "depends_on": "Design app UI/UX"},
  {"task": "Testing and bug fixes", "duration": "4 days", "depends_on": "Develop core features"},
  {"task": "App store submission", "duration": "2 days", "depends_on": "Testing and bug fixes"},
  {"task": "Marketing campaign", "duration": "1 week", "depends_on": "Market research"},
  {"task": "Launch and monitor", "duration": "3 days", "depends_on": "App store submission"}
]`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```json\n?/g, '')
    cleanedText = cleanedText.replace(/```\n?/g, '')
    cleanedText = cleanedText.trim()

    // Parse JSON
    let tasks
    try {
      tasks = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Received text:', text)
      
      // Fallback to mock data
      tasks = [
        { task: "Research and planning", duration: "2 days", depends_on: null },
        { task: "Initial setup", duration: "1 day", depends_on: "Research and planning" },
        { task: "Core development", duration: "1 week", depends_on: "Initial setup" },
        { task: "Testing and refinement", duration: "3 days", depends_on: "Core development" },
        { task: "Launch preparation", duration: "2 days", depends_on: "Testing and refinement" },
      ]
    }

    // Validate structure
    if (!Array.isArray(tasks)) {
      throw new Error('Response is not an array')
    }

    // Ensure all tasks have required fields
    tasks = tasks.map(task => ({
      task: task.task || 'Unnamed task',
      duration: task.duration || '1 day',
      depends_on: task.depends_on || null
    }))

    // Save to history and get the task plan ID
    let taskPlanId = null
    try {
      const savedHistory = await createHistory(authResult.user.id, authResult.user.email, goal, tasks)
      taskPlanId = savedHistory._id
    } catch (historyError) {
      console.error('Failed to save history:', historyError)
      // Don't fail the request if history save fails
    }

    return Response.json({ 
      tasks,
      taskPlanId: taskPlanId ? taskPlanId.toString() : null
    }, { status: 200 })

  } catch (error) {
    console.error('Generate plan error:', error)
    
    return Response.json(
      { 
        error: 'Failed to generate plan. Please try again.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
