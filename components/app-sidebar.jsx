"use client"

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { 
  History, 
  Trash2, 
  User, 
  Clock,
  FileText,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from 'date-fns'

export const AppSidebar = forwardRef(function AppSidebar({ onSelectHistory, onNewChat }, ref) {
  const { user, accessToken } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    if (!accessToken) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  // Expose fetchHistory to parent component
  useImperativeHandle(ref, () => ({
    refreshHistory: fetchHistory
  }))

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/history/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        setHistory([])
      }
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const handleDeleteItem = async (taskPlanId) => {
    try {
      const response = await fetch(`/api/history/${taskPlanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        setHistory(history.filter((item) => item._id !== taskPlanId))
      }
    } catch (error) {
      console.error('Failed to delete history item:', error)
    }
  }

  const handleSelectHistory = (item) => {
    if (onSelectHistory) {
      onSelectHistory(item)
    }
  }

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat()
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Task Planner</span>
              <span className="text-xs text-sidebar-foreground/60">AI-Powered</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="h-8 w-8 p-0 hover:bg-sidebar-accent"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </SidebarGroupLabel>
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your task planning history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                ))
              ) : history.length === 0 ? (
                <div className="px-2 py-8 text-center">
                  <History className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No history yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Your task plans will appear here
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <SidebarMenuItem key={item._id} className="group/item relative">
                    <SidebarMenuButton 
                      onClick={() => handleSelectHistory(item)}
                      className="flex flex-col items-start h-auto py-3 px-2 hover:bg-sidebar-accent"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/70" />
                        <span className="flex-1 text-xs font-medium line-clamp-2 text-left">
                          {item.goal}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-sidebar-foreground/50">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(item._id)
                      }}
                      className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-medium truncate">{user?.email}</span>
            <span className="text-[10px] text-sidebar-foreground/60">Verified Account</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
})
