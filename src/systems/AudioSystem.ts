/**
 * Ambient surf/wind bed, synthesized entirely with the Web Audio API rather
 * than shipped as audio files — no licensing question, no download, and it
 * costs nothing against the load-time budget. Wind volume rides the same
 * WindSystem gust envelope the visuals use, so the two stay in lockstep;
 * surf gets its own slow LFO since it isn't tied to a single scalar the way
 * wind strength is.
 */
export class AudioSystem {
  private readonly context: AudioContext
  private readonly masterGain: GainNode
  private readonly windGain: GainNode
  private muted = false
  private started = false

  constructor() {
    this.context = new AudioContext()

    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = 0
    this.masterGain.connect(this.context.destination)

    this.windGain = this.context.createGain()
    this.windGain.gain.value = 0.25
    this.windGain.connect(this.masterGain)
    this.buildWindBed().connect(this.windGain)

    const surfGain = this.context.createGain()
    surfGain.gain.value = 0.5
    surfGain.connect(this.masterGain)
    this.buildSurfBed(surfGain)

    // Autoplay policy blocks audio before a user gesture; resume silently
    // on the first one rather than showing any kind of prompt.
    document.addEventListener('pointerdown', () => this.context.resume(), { once: true })
    document.addEventListener('keydown', () => this.context.resume(), { once: true })
  }

  /** Fades the whole bed in. Safe to call once the first user gesture has happened. */
  start(fadeSeconds = 2.5): void {
    if (this.started) return
    this.started = true
    this.rampMasterGain(this.muted ? 0 : 1, fadeSeconds)
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    if (this.started) this.rampMasterGain(muted ? 0 : 1, 0.4)
  }

  get isMuted(): boolean {
    return this.muted
  }

  /** Called every frame with the current WindSystem strength (already on its gust envelope). */
  update(windStrength: number): void {
    const target = 0.12 + windStrength * 0.3
    this.windGain.gain.setTargetAtTime(target, this.context.currentTime, 0.5)
  }

  private rampMasterGain(target: number, seconds: number): void {
    const now = this.context.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.linearRampToValueAtTime(target, now + seconds)
  }

  private buildWindBed(): AudioNode {
    const noise = createLoopingNoiseSource(this.context)
    const bandpass = this.context.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 900
    bandpass.Q.value = 0.6
    noise.connect(bandpass)
    return bandpass
  }

  private buildSurfBed(destination: GainNode): void {
    const noise = createLoopingNoiseSource(this.context)
    const lowpass = this.context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 500
    noise.connect(lowpass).connect(destination)

    // A slow LFO on the surf's own gain reads as waves washing in and out.
    const lfo = this.context.createOscillator()
    lfo.frequency.value = 0.12
    const lfoDepth = this.context.createGain()
    lfoDepth.gain.value = 0.35
    lfo.connect(lfoDepth).connect(destination.gain)
    lfo.start()
  }
}

function createLoopingNoiseSource(context: BaseAudioContext): AudioBufferSourceNode {
  const seconds = 2
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.start()
  return source
}
