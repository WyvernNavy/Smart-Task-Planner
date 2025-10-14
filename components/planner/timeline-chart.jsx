"use client"

import { useMemo, useState } from "react"
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell } from "recharts"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

// Custom tick component to handle long text with wrapping
const CustomYAxisTick = ({ x, y, payload }) => {
  const text = payload.value || ''
  const maxCharsPerLine = 35
  const words = text.split(' ')
  const lines = []
  let currentLine = ''
  
  // Split text into multiple lines
  words.forEach(word => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  })
  if (currentLine) lines.push(currentLine)
  
  // Limit to 2 lines max for cleaner look
  const displayLines = lines.slice(0, 2)
  if (lines.length > 2) {
    displayLines[1] = displayLines[1].substring(0, 32) + '...'
  }
  
  const lineHeight = 12
  const startY = -(displayLines.length - 1) * lineHeight / 2
  
  return (
    <g transform={`translate(${x},${y})`}>
      {displayLines.map((line, index) => (
        <text
          key={index}
          x={-8}
          y={startY + index * lineHeight}
          textAnchor="end"
          fill="var(--color-foreground)"
          fontSize={10.5}
          fontWeight={400}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

export function TimelineChart({ data, onTaskUpdate, originalTasks }) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [editedTaskName, setEditedTaskName] = useState("")
  const [editedDurationDays, setEditedDurationDays] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const maxDays = useMemo(() => Math.max(...data.map((d) => d.startDays + d.durationDays), 1), [data])

  const chartData = useMemo(
    () =>
      data.map((d, index) => ({
        name: d.name,
        start: d.startDays,
        duration: d.durationDays,
        index: index,
        originalData: d,
      })),
    [data],
  )

  // Larger bar size for better vertical spacing (prevent text overlap)
  const barSize = 30

  const handleBarClick = (data, index) => {
    if (data) {
      // Find the original task by name, not by index (planned array is sorted differently)
      const originalTask = originalTasks ? originalTasks.find(t => t.task === data.name) : null
      const originalTaskIndex = originalTasks ? originalTasks.findIndex(t => t.task === data.name) : -1
      
      setSelectedTask({
        index: originalTaskIndex,
        name: data.name,
        duration: data.duration,
        originalTask: originalTask,
      })
      setEditedTaskName(data.name)
      // Set duration as numeric days only
      setEditedDurationDays(data.duration.toString())
      setIsDialogOpen(true)
    }
  }

  const handleSaveChanges = () => {
    if (selectedTask && onTaskUpdate) {
      const daysValue = parseFloat(editedDurationDays) || 1
      // Preserve the original task structure including depends_on
      const updatedTask = {
        task: editedTaskName,
        duration: `${daysValue} days`,
        depends_on: selectedTask.originalTask ? selectedTask.originalTask.depends_on : null,
      }
      onTaskUpdate(selectedTask.index, updatedTask)
    }
    setIsDialogOpen(false)
    setSelectedTask(null)
  }

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 20, right: 40, bottom: 20, left: 20 }}
          barCategoryGap="35%"
        >
          <CartesianGrid stroke="var(--color-muted-foreground)" strokeOpacity={0.15} />
          <XAxis
            type="number"
            domain={[0, Math.ceil(maxDays)]}
            tick={{ fill: "var(--color-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={{ stroke: "var(--color-border)" }}
            label={{ value: "Days", position: "insideBottomRight", fill: "var(--color-muted-foreground)", offset: -5 }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={240}
            tick={<CustomYAxisTick />}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={{ stroke: "var(--color-border)" }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
            formatter={(value, name) => {
              if (name === 'duration') return [`${value} days`, 'Duration']
              return [value, name]
            }}
          />
          <Bar dataKey="start" stackId="a" fill="transparent" stroke="transparent" isAnimationActive={false} />
          <Bar
            dataKey="duration"
            stackId="a"
            fill="var(--color-primary)"
            stroke="var(--color-primary)"
            radius={[4, 4, 4, 4]}
            barSize={barSize}
            cursor="pointer"
            onClick={(data, index) => handleBarClick(data, index)}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                onClick={() => handleBarClick(entry, index)}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to the task details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={editedTaskName}
                onChange={(e) => setEditedTaskName(e.target.value)}
                placeholder="Enter task name"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="duration">Duration (in days)</Label>
              <Input
                id="duration"
                type="number"
                min="0.25"
                step="0.25"
                value={editedDurationDays}
                onChange={(e) => setEditedDurationDays(e.target.value)}
                placeholder="e.g., 3, 7, 14"
              />
              <p className="text-xs text-muted-foreground">
                Enter number of days (e.g., 3 for 3 days, 7 for 1 week)
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
