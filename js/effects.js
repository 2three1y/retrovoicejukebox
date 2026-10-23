// Retro effects, done sample-by-sample in plain JavaScript so the saved WAV
// sounds exactly like what you heard. Written for Retro Voice Jukebox (MIT).

function biquad(type, freq, q, sr) {
  const w = 2 * Math.PI * freq / sr, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0; }
  else if (type === 'highpass') { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0; }
  else { b0 = alpha; b1 = 0; b2 = -alpha; } // bandpass, constant peak gain
  a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
  const c = [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  return (x) => {
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = c[0] * x[i] + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
}

function crush(x, sr, holdRate, bits) {
  const y = new Float32Array(x.length);
  const step = sr / holdRate, levels = Math.pow(2, bits - 1);
  let hold = 0, acc = step;
  for (let i = 0; i < x.length; i++) {
    if (acc >= step) { hold = Math.round(x[i] * levels) / levels; acc -= step; }
    acc += 1; y[i] = hold;
  }
  return y;
}

function saturate(x, drive) {
  const y = new Float32Array(x.length), k = Math.tanh(drive);
  for (let i = 0; i < x.length; i++) y[i] = Math.tanh(x[i] * drive) / k;
  return y;
}

// Small deterministic noise so tests are repeatable.
function noise(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1; }

export function normalize(x, peak = 0.89) {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  if (m < 1e-6) return x;
  const g = peak / m, y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
  return y;
}

export const EFFECTS = {
  clean: { label: 'Clean', about: 'The synthesizer straight, nothing added.' },
  soundcard: { label: "'90s sound card", about: '8-bit audio at 11 kilohertz with a muffled little speaker, like an early-90s PC sound card.' },
  robot: { label: 'Robot', about: 'Ring modulation and a metal tube echo.' },
  bitcrush: { label: 'Bitcrush arcade', about: '4-bit, 6 kilohertz crunch, like an arcade cabinet.' },
  telephone: { label: 'Telephone', about: 'Narrow phone-line band from 300 to 3400 hertz.' },
  radio: { label: 'Walkie-talkie', about: 'Squashed radio band with a squelch click and hiss.' },
  echo: { label: 'Space station', about: 'Long echo, like a big metal hall.' },
};

export function applyEffect(name, input, sr) {
  let x = input;
  switch (name) {
    case 'soundcard': {
      x = crush(biquad('lowpass', 4500, 0.7, sr)(x), sr, 11025, 8);
      x = biquad('lowpass', 5000, 0.8, sr)(biquad('highpass', 180, 0.7, sr)(x));
      const n = noise(91); for (let i = 0; i < x.length; i++) x[i] += n() * 0.004;
      break;
    }
    case 'robot': {
      const y = new Float32Array(x.length);
      for (let i = 0; i < x.length; i++) y[i] = x[i] * (0.35 + 0.65 * Math.sin(2 * Math.PI * 55 * i / sr));
      const d = Math.round(sr * 0.0065), z = new Float32Array(y.length);
      for (let i = 0; i < y.length; i++) z[i] = y[i] + (i >= d ? 0.6 * z[i - d] : 0);
      x = saturate(z, 1.5);
      break;
    }
    case 'bitcrush':
      x = crush(x, sr, 6000, 4);
      break;
    case 'telephone':
      x = biquad('lowpass', 3400, 0.9, sr)(biquad('highpass', 300, 0.9, sr)(x));
      x = biquad('lowpass', 3400, 0.9, sr)(biquad('highpass', 300, 0.9, sr)(x));
      x = saturate(x, 2);
      break;
    case 'radio': {
      x = biquad('bandpass', 1400, 0.9, sr)(x);
      x = saturate(x, 6);
      const lead = Math.round(sr * 0.12), tail = Math.round(sr * 0.18), y = new Float32Array(x.length + lead + tail), n = noise(7);
      for (let i = 0; i < y.length; i++) y[i] = n() * 0.035;
      for (let i = 0; i < x.length; i++) y[lead + i] += x[i] * 0.8;
      for (let i = 0; i < 60; i++) { y[i] += (i % 2 ? 0.5 : -0.5) * (1 - i / 60); y[y.length - 1 - i] += (i % 2 ? 0.5 : -0.5) * (1 - i / 60); }
      x = y;
      break;
    }
    case 'echo': {
      const d = Math.round(sr * 0.21), tail = d * 5, y = new Float32Array(x.length + tail);
      for (let i = 0; i < y.length; i++) y[i] = (i < x.length ? x[i] : 0) + (i >= d ? 0.45 * y[i - d] : 0);
      x = y;
      break;
    }
    default:
      x = new Float32Array(x);
  }
  return normalize(x);
}

export function toWav(samples, sr) {
  const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  return buf;
}
