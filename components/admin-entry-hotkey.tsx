"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const HOTKEY_STORAGE_KEY = "portfolio_admin_hotkey"
const DEFAULT_HOTKEY = "Meta+Shift+L"

function normalizeHotkey(value: string) {
  return value
    .split("+")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const lower = entry.toLowerCase()
      if (lower === "cmd") return "Meta"
      if (lower === "control") return "Ctrl"
      if (lower === "option") return "Alt"
      if (lower === "command") return "Meta"
      if (lower === "shift") return "Shift"
      if (entry.length === 1) return entry.toUpperCase()
      return entry[0].toUpperCase() + entry.slice(1).toLowerCase()
    })
    .join("+")
}

function eventMatchesHotkey(event: KeyboardEvent, hotkey: string) {
  const parts = hotkey.split("+")
  const key = parts[parts.length - 1]?.toLowerCase()
  const hasCtrl = parts.includes("Ctrl")
  const hasMeta = parts.includes("Meta")
  const hasShift = parts.includes("Shift")
  const hasAlt = parts.includes("Alt")

  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase()

  return (
    eventKey === key &&
    event.ctrlKey === hasCtrl &&
    event.metaKey === hasMeta &&
    event.shiftKey === hasShift &&
    event.altKey === hasAlt
  )
}

interface AdminEntryHotkeyProps {
  adminPath: string
}

export default function AdminEntryHotkey({ adminPath }: AdminEntryHotkeyProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [hotkey, setHotkey] = useState(DEFAULT_HOTKEY)
  const [draftHotkey, setDraftHotkey] = useState(DEFAULT_HOTKEY)

  useEffect(() => {
    const stored = window.localStorage.getItem(HOTKEY_STORAGE_KEY)
    if (!stored) return

    const normalized = normalizeHotkey(stored)
    if (!normalized) return

    setHotkey(normalized)
    setDraftHotkey(normalized)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (eventMatchesHotkey(event, hotkey)) {
        event.preventDefault()
        router.push(adminPath)
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "h") {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [adminPath, hotkey, router])

  const saveHotkey = () => {
    const normalized = normalizeHotkey(draftHotkey)
    if (!normalized) return

    window.localStorage.setItem(HOTKEY_STORAGE_KEY, normalized)
    setHotkey(normalized)
    setDraftHotkey(normalized)
    setIsOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="sr-only" aria-hidden="true" tabIndex={-1}>
            Open hotkey settings
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Admin Hotkey</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input value={draftHotkey} onChange={(event) => setDraftHotkey(event.target.value)} />
            <div className="flex justify-end">
              <Button type="button" onClick={saveHotkey}>
                Save Hotkey
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
