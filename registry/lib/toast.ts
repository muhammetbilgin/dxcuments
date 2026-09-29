import { play, type SoundName } from "cuelume"
import type { ReactNode } from "react"
import { sileo, type SileoPosition } from "sileo"

interface ToastOptions {
  description?: ReactNode | string
  duration?: number
  icon?: ReactNode
}

type ToastTone = "success" | "error" | "warning" | "info"

const TONE_SOUND: Record<ToastTone | "loading", SoundName> = {
  success: "success",
  error: "error",
  warning: "whisper",
  info: "chime",
  loading: "loading",
}

function playTone(tone: ToastTone | "loading") {
  play(TONE_SOUND[tone])
}

function show(tone: ToastTone, title: string, options?: ToastOptions) {
  playTone(tone)
  return sileo[tone]({
    title,
    description: options?.description,
    duration: options?.duration,
    icon: options?.icon,
  })
}

type PromiseMessage<T> = string | ((data: T) => string)
type PromiseErrorMessage = string | ((err: unknown) => string)

interface PromiseOptions<T> {
  loading: string
  success: PromiseMessage<T>
  error: PromiseErrorMessage
}

function resolveMessage<T>(message: PromiseMessage<T>, data: T): string {
  return typeof message === "function" ? message(data) : message
}

function resolveError(message: PromiseErrorMessage, err: unknown): string {
  return typeof message === "function" ? message(err) : message
}

export const toast = {
  success(title: string, options?: ToastOptions) {
    return show("success", title, options)
  },
  error(title: string, options?: ToastOptions) {
    return show("error", title, options)
  },
  warning(title: string, options?: ToastOptions) {
    return show("warning", title, options)
  },
  info(title: string, options?: ToastOptions) {
    return show("info", title, options)
  },
  promise<T>(promise: Promise<T>, options: PromiseOptions<T>) {
    playTone("loading")
    return sileo.promise(promise, {
      loading: { title: options.loading },
      success: (data) => {
        playTone("success")
        return { title: resolveMessage(options.success, data) }
      },
      error: (err) => {
        playTone("error")
        return { title: resolveError(options.error, err) }
      },
    })
  },
  dismiss(id: string) {
    sileo.dismiss(id)
  },
  clear(position?: SileoPosition) {
    sileo.clear(position)
  },
}
