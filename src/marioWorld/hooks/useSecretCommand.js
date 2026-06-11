import { useEffect, useRef } from 'react'

const IDLE_TIMEOUT_MS = 2000

function isEditableTarget() {
  const tag = document.activeElement?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable
}

export default function useSecretCommand({ commands = [], onUnlock = () => {} }) {
  const bufferRef = useRef('')
  const idleRef = useRef(null)
  // Keep latest commands/onUnlock in refs so the keydown listener doesn't
  // re-attach (and lose buffer) on every parent re-render.
  const commandsRef = useRef(commands)
  const onUnlockRef = useRef(onUnlock)
  useEffect(() => { commandsRef.current = commands }, [commands])
  useEffect(() => { onUnlockRef.current = onUnlock }, [onUnlock])

  useEffect(() => {
    const reset = () => {
      bufferRef.current = ''
      if (idleRef.current) { clearTimeout(idleRef.current); idleRef.current = null }
    }
    const onKeyDown = (e) => {
      if (isEditableTarget()) return
      if (e.key === 'Escape' || e.key === 'Backspace') { reset(); return }
      // accept printable single chars + '/'
      if (e.key.length !== 1) return
      bufferRef.current = (bufferRef.current + e.key).slice(-32)
      if (idleRef.current) clearTimeout(idleRef.current)
      idleRef.current = setTimeout(reset, IDLE_TIMEOUT_MS)
      for (const cmd of commandsRef.current) {
        if (bufferRef.current.endsWith(cmd)) {
          onUnlockRef.current(cmd)
          reset()
          break
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (idleRef.current) clearTimeout(idleRef.current)
    }
  }, [])
}
