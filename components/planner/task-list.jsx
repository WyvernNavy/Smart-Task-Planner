"use client"

export function TaskList({ tasks }) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {tasks.map((t, index) => (
        <li key={`task-${index}-${t.task}`} className="rounded-md border border-border bg-card/60 p-3 shadow-sm transition hover:shadow">
          <div className="text-sm font-medium">{t.task}</div>
          <div className="mt-1 text-xs text-muted-foreground">Duration: {t.duration}</div>
          <div className="text-xs text-muted-foreground">Dependency: {t.depends_on ? t.depends_on : "None"}</div>
        </li>
      ))}
    </ul>
  )
}
