export type QualityTier = 'high' | 'low'

export interface ControlsOptions {
  initialMuted: boolean
  initialQualityTier: QualityTier
  onMuteToggle: (muted: boolean) => void
  onQualityToggle: (tier: QualityTier) => void
}

const SOUND_ON_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 9 9 13 5 13 19 9 15 4 15 4 9"/><path d="M17 8.5a5 5 0 0 1 0 7"/><path d="M19.5 6a8.5 8.5 0 0 1 0 12"/></svg>'

const SOUND_OFF_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 9 9 13 5 13 19 9 15 4 15 4 9"/><line x1="17" y1="9" x2="22" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>'

/**
 * The only persistent UI chrome the PRD allows: a mute toggle and a quality
 * toggle, both small and corner-docked. Plain DOM/CSS — two buttons don't
 * justify a UI framework on top of three.js (see PLANNING.md).
 */
export function mountControls(options: ControlsOptions): HTMLElement {
  const container = document.createElement('div')
  container.className = 'isla-controls'

  let muted = options.initialMuted
  const muteButton = document.createElement('button')
  muteButton.type = 'button'
  muteButton.className = 'isla-control-btn'
  const renderMute = () => {
    muteButton.innerHTML = muted ? SOUND_OFF_ICON : SOUND_ON_ICON
    muteButton.setAttribute('aria-label', muted ? 'Unmute' : 'Mute')
    muteButton.setAttribute('aria-pressed', String(muted))
  }
  renderMute()
  muteButton.addEventListener('click', () => {
    muted = !muted
    renderMute()
    options.onMuteToggle(muted)
  })

  let tier = options.initialQualityTier
  const qualityButton = document.createElement('button')
  qualityButton.type = 'button'
  qualityButton.className = 'isla-control-btn isla-control-btn--text'
  const renderQuality = () => {
    qualityButton.textContent = tier === 'high' ? 'HD' : 'SD'
    qualityButton.setAttribute('aria-label', `Graphics quality: ${tier}. Click to switch.`)
  }
  renderQuality()
  qualityButton.addEventListener('click', () => {
    tier = tier === 'high' ? 'low' : 'high'
    renderQuality()
    options.onQualityToggle(tier)
  })

  container.append(muteButton, qualityButton)
  document.body.appendChild(container)
  return container
}
