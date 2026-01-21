// Transaction success sound using Web Audio API
export function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create a pleasant "ding" sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Pleasant bell-like tone
    oscillator.frequency.setValueAtTime(830, audioContext.currentTime) // G#5
    oscillator.type = 'sine'

    // Quick fade in and out for a clean "ding"
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)

    // Add a second harmonic for richness
    const oscillator2 = audioContext.createOscillator()
    const gainNode2 = audioContext.createGain()

    oscillator2.connect(gainNode2)
    gainNode2.connect(audioContext.destination)

    oscillator2.frequency.setValueAtTime(1245, audioContext.currentTime) // E6
    oscillator2.type = 'sine'

    gainNode2.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01)
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

    oscillator2.start(audioContext.currentTime)
    oscillator2.stop(audioContext.currentTime + 0.4)
  } catch (e) {
    // Audio not supported or blocked, fail silently
    console.log('Audio playback not available')
  }
}
