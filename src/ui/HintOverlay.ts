const IDLE_DELAY_MS = 2500
const REMOVE_DELAY_MS = 700 // lets the CSS fade-out finish before the element leaves the DOM

export interface HintOverlayHandle {
  /** Call on the visitor's first interaction — fades out and never reappears. */
  dismiss: () => void
}

/** Fades in after a few idle seconds, dismissed for good on first interaction — never a modal. */
export function mountHintOverlay(message = 'Drag the sand'): HintOverlayHandle {
  const el = document.createElement('div')
  el.className = 'isla-hint'
  el.textContent = message
  document.body.appendChild(el)

  const showTimer = window.setTimeout(() => {
    el.classList.add('isla-hint--visible')
  }, IDLE_DELAY_MS)

  let dismissed = false

  function dismiss(): void {
    if (dismissed) return
    dismissed = true
    window.clearTimeout(showTimer)
    el.classList.remove('isla-hint--visible')
    window.setTimeout(() => el.remove(), REMOVE_DELAY_MS)
  }

  return { dismiss }
}
