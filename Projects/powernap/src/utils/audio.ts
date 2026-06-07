// Audio synthesis utility using Web Audio API for alarm sounds

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audioCtx: AudioContext | null = null;
let alarmInterval: number | null = null;
let activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];

// Initialize Audio Context lazily on user interaction
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const extWindow = window as unknown as ExtendedWindow;
    const AudioContextClass = window.AudioContext || extWindow.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

// Ensure the context is running (resume if suspended by browser autoplay policy)
async function resumeContext(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return true;
    } catch (e) {
      console.warn('Failed to resume AudioContext:', e);
      return false;
    }
  }
  return true;
}

// 1. Gentle Chime sound
function playChimeNote(ctx: AudioContext, destination: AudioNode, time: number, freq: number, duration: number, volume: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  // Root note (sine) and a higher harmonic (sine) for metallic/bell-like chime
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, time);
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 1.5, time); // fifth harmonic

  gainNode.gain.setValueAtTime(0, time);
  // Quick attack, long linear decay
  gainNode.gain.linearRampToValueAtTime(volume * 0.4, time + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);

  activeOscillators.push({ osc: osc1, gain: gainNode });
  activeOscillators.push({ osc: osc2, gain: gainNode });
}

// 2. Digital Beep sound
function playBeepNote(ctx: AudioContext, destination: AudioNode, time: number, freq: number, duration: number, volume: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'square'; // square wave for digital beep
  osc.frequency.setValueAtTime(freq, time);

  gainNode.gain.setValueAtTime(0, time);
  gainNode.gain.setValueAtTime(volume * 0.3, time + 0.01);
  gainNode.gain.setValueAtTime(volume * 0.3, time + duration - 0.01);
  gainNode.gain.linearRampToValueAtTime(0, time + duration);

  osc.connect(gainNode);
  gainNode.connect(destination);

  osc.start(time);
  osc.stop(time + duration);

  activeOscillators.push({ osc, gain: gainNode });
}

// 3. Calming Synth sound
function playSynthChord(ctx: AudioContext, destination: AudioNode, time: number, freqs: number[], duration: number, volume: number) {
  const chordGains: GainNode[] = [];
  
  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle'; // triangle wave for soft synthesizer chord
    osc.frequency.setValueAtTime(freq, time);

    gainNode.gain.setValueAtTime(0, time);
    // Slow attack (warm swell), long release
    gainNode.gain.linearRampToValueAtTime(volume * 0.15, time + 0.4 + index * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(destination);

    osc.start(time);
    osc.stop(time + duration);

    activeOscillators.push({ osc, gain: gainNode });
    chordGains.push(gainNode);
  });
}

// 4. Rhythmic Pulse sound
function playPulseNote(ctx: AudioContext, destination: AudioNode, time: number, freq: number, duration: number, volume: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gainNode.gain.setValueAtTime(0, time);
  // Smooth swell and fade (bell shape)
  gainNode.gain.linearRampToValueAtTime(volume * 0.4, time + duration * 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gainNode);
  gainNode.connect(destination);

  osc.start(time);
  osc.stop(time + duration);

  activeOscillators.push({ osc, gain: gainNode });
}

// Stop all playing oscillators and intervals
export function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }

  activeOscillators.forEach(({ osc, gain }) => {
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch {
      // Ignore errors from already stopped nodes
    }
  });
  activeOscillators = [];
}

// Play an alarm in a loop
export async function playAlarm(soundName: string, volume: number) {
  stopAlarm(); // stop any current alarm first

  const ctx = getAudioContext();
  if (!ctx) return;

  const ok = await resumeContext(ctx);
  if (!ok) return;

  const playSequence = () => {
    const now = ctx.currentTime;

    switch (soundName) {
      case 'beep':
        // Beep beep, beep beep (2 pairs of beeps)
        playBeepNote(ctx, ctx.destination, now, 880, 0.12, volume);
        playBeepNote(ctx, ctx.destination, now + 0.2, 880, 0.12, volume);
        playBeepNote(ctx, ctx.destination, now + 0.6, 880, 0.12, volume);
        playBeepNote(ctx, ctx.destination, now + 0.8, 880, 0.12, volume);
        break;

      case 'synth':
        // Warm rich chord C-major triad (C4, E4, G4, C5)
        playSynthChord(ctx, ctx.destination, now, [261.63, 329.63, 392.00, 523.25], 3.5, volume);
        break;

      case 'pulse':
        // Low pulsing alert
        playPulseNote(ctx, ctx.destination, now, 220, 0.6, volume);
        playPulseNote(ctx, ctx.destination, now + 0.8, 220, 0.6, volume);
        break;

      case 'chime':
      default:
        // Gentle descending metal chimes (C5, G4, E4)
        playChimeNote(ctx, ctx.destination, now, 523.25, 2.5, volume); // C5
        playChimeNote(ctx, ctx.destination, now + 0.4, 392.00, 2.0, volume); // G4
        playChimeNote(ctx, ctx.destination, now + 0.8, 329.63, 1.8, volume); // E4
        break;
    }
  };

  // Run immediately and then set interval
  playSequence();
  
  // Set interval matching the sound repeat cycle
  const intervalTime = soundName === 'beep' ? 2000 : (soundName === 'synth' ? 4000 : (soundName === 'pulse' ? 2000 : 3000));
  alarmInterval = window.setInterval(playSequence, intervalTime);
}

// Play a short 1.5s preview of the sound (does not loop)
export async function previewSound(soundName: string, volume: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const ok = await resumeContext(ctx);
  if (!ok) return;

  const now = ctx.currentTime;

  switch (soundName) {
    case 'beep':
      playBeepNote(ctx, ctx.destination, now, 880, 0.15, volume);
      playBeepNote(ctx, ctx.destination, now + 0.25, 880, 0.15, volume);
      break;

    case 'synth':
      playSynthChord(ctx, ctx.destination, now, [261.63, 329.63, 392.00, 523.25], 1.5, volume);
      break;

    case 'pulse':
      playPulseNote(ctx, ctx.destination, now, 220, 0.8, volume);
      break;

    case 'chime':
    default:
      playChimeNote(ctx, ctx.destination, now, 523.25, 1.5, volume);
      break;
  }
}
