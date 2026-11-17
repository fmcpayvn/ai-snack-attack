// All sound is synthesized with WebAudio: short oscillator blips, no files.
// The context starts on the first user gesture, so nothing plays uninvited.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  /** One note: an oscillator that slides in pitch and fades out. */
  function blip(fromHz, toHz, seconds, type, volume, delay) {
    if (muted) return;
    const audio = ensure();
    if (audio === null) return;
    const start = audio.currentTime + (delay || 0);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type || 'square';
    oscillator.frequency.setValueAtTime(fromHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.08, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.02);
  }

  return {
    /** Call from any gesture so later sounds are allowed to play. */
    unlock() {
      ensure();
    },
    eat(combo) {
      const base = 420 + Math.min(combo, 12) * 28;
      blip(base, base * 1.6, 0.09, 'square', 0.07, 0);
    },
    golden() {
      blip(660, 990, 0.1, 'triangle', 0.09, 0);
      blip(990, 1320, 0.12, 'triangle', 0.09, 0.09);
    },
    levelUp() {
      blip(523, 523, 0.09, 'triangle', 0.08, 0);
      blip(659, 659, 0.09, 'triangle', 0.08, 0.09);
      blip(784, 784, 0.14, 'triangle', 0.08, 0.18);
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((note, index) => blip(note, note, 0.16, 'triangle', 0.09, index * 0.12));
    },
    lose() {
      blip(320, 90, 0.5, 'sawtooth', 0.08, 0);
      blip(210, 70, 0.5, 'sawtooth', 0.06, 0.12);
    },
    click() {
      blip(700, 900, 0.05, 'square', 0.05, 0);
    },
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
  };
}
