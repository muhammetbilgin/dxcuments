"use client"

import { useEffect, useState } from "react"
import {
  Toaster as SileoToaster,
  type SileoOptions,
  type SileoPosition,
} from "sileo"
import "sileo/styles.css"
import "./toaster.css"

interface ToasterProps {
  position?: SileoPosition
  options?: SileoOptions
}

function useResolvedShellTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  )

  useEffect(() => {
    const root = document.documentElement

    function syncTheme() {
      setTheme(root.classList.contains("dark") ? "dark" : "light")
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return theme
}

export function Toaster({ position = "top-right", options }: ToasterProps) {
  const theme = useResolvedShellTheme()
  return <SileoToaster theme={theme} position={position} options={options} />
}
