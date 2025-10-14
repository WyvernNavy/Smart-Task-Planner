"use client"

import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

    const shouldDark = stored ? stored === "dark" : prefersDark
    setIsDark(shouldDark)
    if (shouldDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  )
}
