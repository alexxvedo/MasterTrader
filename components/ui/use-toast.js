"use client"

import { useEffect, useState } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toasts = []

export const useToast = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toast = ({
    title,
    description,
    variant,
    duration = 5000,
  }) => {
    const id = generateId()

    const newToast = {
      id,
      title,
      description,
      variant,
      duration,
    }

    toasts.push(newToast)

    setTimeout(() => {
      toasts.splice(toasts.indexOf(newToast), 1)
    }, duration)

    return newToast
  }

  const dismiss = (toastId) => {
    const index = toasts.findIndex((toast) => toast.id === toastId)
    if (index !== -1) {
      toasts.splice(index, 1)
    }
  }

  return {
    toast,
    dismiss,
    toasts: mounted ? toasts : [],
  }
}

// Create a toast function that doesn't rely on hooks
let TOAST_FUNCTION = null;

// This function will be called by the Toaster component to set the actual toast function
export function setToastFunction(toastFn) {
  TOAST_FUNCTION = toastFn;
}

// Export a toast function that uses the stored reference
export const toast = (props) => {
  if (!TOAST_FUNCTION) {
    console.warn("Toast function not initialized yet. Make sure the Toaster component is mounted.");
    return { id: "toast-error", dismiss: () => {} };
  }
  return TOAST_FUNCTION(props);
}
