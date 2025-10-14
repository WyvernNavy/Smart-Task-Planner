"use client"

import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { TimelineChart } from "@/components/planner/timeline-chart"
import { TaskList } from "@/components/planner/task-list"
import { ThemeToggle } from "@/components/planner/theme-toggle"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { LogOut, Loader2 } from "lucide-react"

function parseDurationToDays(input) {
  const s = input.trim().toLowerCase()
  const match = s.match(/(\d+(?:\.\d+)?)\s*(day|days|d|week|weeks|w|hour|hours|h)?/)
  if (!match) return 1
  const value = Number.parseFloat(match[1])
  const unit = match[2] || "days"
  switch (unit) {
    case "day":
    case "days":
    case "d":
      return Math.max(0.25, value)
    case "week":
    case "weeks":
    case "w":
      return Math.max(0.25, value * 7)
    case "hour":
    case "hours":
    case "h":
      return Math.max(0.25, value / 24)
    default:
      return Math.max(0.25, value)
  }
}

function buildPlannedTasks(tasks) {
  const byName = new Map()
  tasks.forEach((t) => byName.set(t.task, t))

  const planned = []
  const computed = new Map()
  const computing = new Set() // Track tasks currently being computed to detect circular dependencies

  const getOrCompute = (name) => {
    const cached = computed.get(name)
    if (cached) return cached

    // Detect circular dependency
    if (computing.has(name)) {
      console.warn(`Circular dependency detected for task: ${name}`)
      const fallback = { name, durationDays: 1, startDays: 0 }
      computed.set(name, fallback)
      return fallback
    }

    const t = byName.get(name)
    if (!t) {
      const fallback = { name, durationDays: 1, startDays: 0 }
      computed.set(name, fallback)
      return fallback
    }

    // Mark this task as being computed
    computing.add(name)

    const durationDays = parseDurationToDays(t.duration)
    let startDays = 0
    if (t.depends_on) {
      const dep = getOrCompute(t.depends_on)
      startDays = dep.startDays + dep.durationDays
    }

    const plannedItem = {
      name: t.task,
      durationDays,
      startDays,
      dependsOn: t.depends_on,
    }
    
    // Remove from computing set and cache the result
    computing.delete(name)
    computed.set(name, plannedItem)
    return plannedItem
  }

  tasks.forEach((t) => {
    planned.push(getOrCompute(t.task))
  })

  planned.sort((a, b) => a.startDays - b.startDays || a.name.localeCompare(b.name))
  return planned
}

// Sort tasks by their execution order (based on dependencies and start time)
function sortTasksByExecutionOrder(tasks, planned) {
  if (!planned || planned.length === 0) return tasks
  
  // Create a map of task name to start time
  const startTimeMap = new Map()
  planned.forEach(p => {
    startTimeMap.set(p.name, p.startDays)
  })
  
  // Sort tasks by their start time
  const sorted = [...tasks].sort((a, b) => {
    const startA = startTimeMap.get(a.task) ?? 999999
    const startB = startTimeMap.get(b.task) ?? 999999
    return startA - startB || a.task.localeCompare(b.task)
  })
  
  return sorted
}

export default function Page() {
  const [goal, setGoal] = useState("")
  const [tasks, setTasks] = useState(null)
  const [planned, setPlanned] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentTaskPlanId, setCurrentTaskPlanId] = useState(null)
  const { user, accessToken, isAuthenticated, logout, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const sidebarRef = useRef(null)

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, authLoading, router])

  const canSubmit = useMemo(() => goal.trim().length > 0 && !loading, [goal, loading])

  // Sort tasks by execution order (based on timeline)
  const sortedTasks = useMemo(() => {
    if (!tasks || !planned) return tasks
    return sortTasksByExecutionOrder(tasks, planned)
  }, [tasks, planned])

  const handleGenerate = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ goal }),
      })
      
      if (res.status === 401) {
        // Unauthorized - redirect to login
        logout()
        return
      }
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Request failed with status ${res.status}`)
      }
      
      const data = await res.json()
      setTasks(data.tasks || data) // Support both old and new format
      setPlanned(buildPlannedTasks(data.tasks || data))
      setCurrentTaskPlanId(data.taskPlanId || null) // Store the task plan ID
      
      // Refresh history sidebar after creating new task plan
      if (sidebarRef.current && data.taskPlanId) {
        sidebarRef.current.refreshHistory()
      }
    } catch (e) {
      setError(e?.message || "Something went wrong.")
      setTasks(null)
      setPlanned(null)
    } finally {
      setLoading(false)
    }
  }, [goal, accessToken, logout])

  const handleReset = useCallback(() => {
    setGoal("")
    setTasks(null)
    setPlanned(null)
    setError(null)
    setLoading(false)
    setCurrentTaskPlanId(null)
  }, [])

  const handleSelectHistory = useCallback((historyItem) => {
    setGoal(historyItem.goal)
    setTasks(historyItem.tasks)
    setPlanned(buildPlannedTasks(historyItem.tasks))
    setError(null)
    setCurrentTaskPlanId(historyItem._id)
  }, [])

  const handleNewChat = useCallback(() => {
    setGoal("")
    setTasks(null)
    setPlanned(null)
    setError(null)
    setCurrentTaskPlanId(null)
  }, [])

  const handleTaskUpdate = useCallback(async (taskIndex, updatedTask) => {
    if (!tasks) return
    
    const newTasks = [...tasks]
    const oldTask = newTasks[taskIndex]
    const oldTaskName = oldTask.task
    const newTaskName = updatedTask.task
    
    // Update the task
    newTasks[taskIndex] = {
      ...oldTask,
      task: newTaskName,
      duration: updatedTask.duration,
      depends_on: updatedTask.depends_on !== undefined ? updatedTask.depends_on : oldTask.depends_on,
    }
    
    // If task name changed, update all dependencies that reference this task
    if (oldTaskName !== newTaskName) {
      newTasks.forEach((t, idx) => {
        if (t.depends_on === oldTaskName) {
          newTasks[idx] = {
            ...t,
            depends_on: newTaskName
          }
        }
      })
    }
    
    // Find all tasks that depend on this one (directly or indirectly)
    // Use a Set to track visited tasks and prevent infinite loops from circular dependencies
    const findDependentTasks = (taskName, visited = new Set()) => {
      // Prevent infinite recursion from circular dependencies
      if (visited.has(taskName)) {
        return []
      }
      visited.add(taskName)
      
      const dependents = []
      newTasks.forEach((t, idx) => {
        if (t.depends_on === taskName && !visited.has(t.task)) {
          dependents.push({ name: t.task, index: idx })
          // Recursively find tasks that depend on this dependent
          dependents.push(...findDependentTasks(t.task, visited))
        }
      })
      return dependents
    }
    
    const affectedTasks = findDependentTasks(newTaskName)
    
    // Update state (this will trigger buildPlannedTasks which recalculates all timelines)
    setTasks(newTasks)
    setPlanned(buildPlannedTasks(newTasks))
    
    // Save to database if we have a task plan ID
    if (currentTaskPlanId) {
      try {
        const response = await fetch(`/api/task-plans/${currentTaskPlanId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ tasks: newTasks })
        })

        if (!response.ok) {
          throw new Error('Failed to save changes to database')
        }
      } catch (error) {
        console.error('Error saving to database:', error)
        toast({
          title: "Warning",
          description: "Task updated locally but failed to save to database. Changes may be lost.",
          variant: "destructive",
        })
        return
      }
    }
    
    // Show notification if dependent tasks were affected
    if (affectedTasks.length > 0) {
      toast({
        title: "Task updated",
        description: `Updated "${newTaskName}" and ${affectedTasks.length} dependent task${affectedTasks.length > 1 ? 's' : ''} automatically adjusted their timeline.`,
      })
    } else {
      toast({
        title: "Task updated",
        description: `Successfully updated "${newTaskName}".`,
      })
    }
  }, [tasks, toast, currentTaskPlanId, accessToken])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar ref={sidebarRef} onSelectHistory={handleSelectHistory} onNewChat={handleNewChat} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Smart Task Planner</h1>
              <p className="text-xs text-muted-foreground">Break down your goals into actionable tasks with AI</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-col gap-3">
            <label htmlFor="goal" className="sr-only">
              Enter your goal
            </label>
            <textarea
              id="goal"
              rows={4}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter your goal (e.g., Launch a product in 2 weeks)"
              className="w-full resize-y rounded-md border border-input bg-background p-3 leading-relaxed outline-none ring-ring/0 transition focus:ring-2"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground"
                    />
                    Generating...
                  </span>
                ) : (
                  "Generate Plan"
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90"
              >
                Reset
              </button>
            </div>
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground"
              >
                {error}
              </div>
            )}
          </div>

          {tasks && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-lg font-medium">Tasks</h2>
                <TaskList tasks={sortedTasks || tasks} />
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-lg font-medium">Timeline</h2>
                {planned && planned.length > 0 ? (
                  <div style={{ height: `${Math.max(400, planned.length * 60)}px` }}>
                    <TimelineChart data={planned} originalTasks={tasks} onTaskUpdate={handleTaskUpdate} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data to display.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
