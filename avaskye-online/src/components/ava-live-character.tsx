"use client"

import { useEffect, useState } from "react"

const SITTING = "/ava/desk-sitting.jpg"
const STANDING = "/ava/desk-standing.jpg"

export function AvaLiveCharacter({
  standing = false,
  className = "",
}: {
  standing?: boolean
  className?: string
}) {
  const [speaking, setSpeaking] = useState(false)
  const src = standing ? STANDING : SITTING

  useEffect(() => {
    function onSpeak() { setSpeaking(true) }
    function onIdle() { setSpeaking(false) }
    window.addEventListener("ava:speaking", onSpeak)
    window.addEventListener("ava:idle", onIdle)
    return () => {
      window.removeEventListener("ava:speaking", onSpeak)
      window.removeEventListener("ava:idle", onIdle)
    }
  }, [])

  return (
    <img
      src={src}
      alt="Ava Skye speaking from her office"
      className={`ava-character ${speaking ? "speaking" : "idle"} ${className}`}
    />
  )
}
