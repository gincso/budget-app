"use client"

import * as React from "react"
import hotToast, { type Toast, Toaster as HotToaster } from "react-hot-toast"
import { cn } from "@/lib/utils"

const Toaster = () => {
  return (
    <HotToaster
      toastOptions={{
        className: "",
        style: {
          background: "var(--color-background)",
          color: "var(--color-foreground)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          maxWidth: "420px",
          padding: "0.75rem 1rem",
        },
        success: {
          iconTheme: {
            primary: "var(--color-success)",
            secondary: "var(--color-background)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-destructive)",
            secondary: "var(--color-background)",
          },
        },
      }}
    />
  )
}

const toast = hotToast

export { Toaster, toast }
