"use client"

import { useEffect } from "react"
import { ToastProvider } from "@/components/ui/toast"
import { useToast, setToastFunction } from "@/components/ui/use-toast"

export function Toaster({ children }) {
  const { toast } = useToast()
  
  // Set the toast function for direct imports
  useEffect(() => {
    setToastFunction(toast)
    
    // Cleanup when unmounted
    return () => setToastFunction(null)
  }, [toast])
  
  return <ToastProvider>{children}</ToastProvider>
}
