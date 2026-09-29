import { useEffect, useState } from "react"

const MD_QUERY = "(min-width: 768px)"

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MD_QUERY).matches : true
  )

  useEffect(() => {
    const media = window.matchMedia(MD_QUERY)
    function onChange() {
      setIsDesktop(media.matches)
    }
    onChange()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return isDesktop
}
