import { loadSharpVox } from './sharpvox-engine.js';
import { applyEffect, toWav, EFFECTS } from './effects.js';
import { VOICES, PRESETS, resolvePreset } from './presets.js';

const $ = (id) => document.getElementById(id);
const els = {
  text: $('text'), speak: $('speak'), stop: $('stop'), save: $('save'), state: $('engine-state'),
  list: $('preset-list'), sayNames: $('say-names'), voice: $('voice'), effect: $('effect'),
  effectAbout: $('effect-about'), pitch: $('pitch'), pitchOut: $('pitch-out'), rate: $('rate'),
  rateOut: $('rate-out'), device: $('device-voice'), announcer: $('announcer'), player: $('player'),
};

let engine = null;
let lastWav = null, lastUrl = null, lastName = 'jukebox';
let current = { preset: PRESETS[0] };

// One polite live region, used sparingly.
let announceTimer;
function announce(msg) {
  clearTimeout(announceTimer);
  els.announcer.textContent = '';
  announceTimer = setTimeout(() => { els.announcer.textContent = msg; }, 60);
}

function pitchWords(hz) {
  const band = hz < 110 ? 'very low' : hz < 160 ? 'low' : hz < 230 ? 'medium' : hz < 300 ? 'high' : 'very high';
  return `${hz} hertz, ${band}`;
}
function rateWords(wpm) {
  const band = wpm < 130 ? 'slow' : wpm < 200 ? 'normal' : wpm < 300 ? 'fast' : 'very fast';
  return `${wpm} words per minute, ${band}`;
}
function syncSliderText() {
  const p = +els.pitch.value, r = +els.rate.value;
  els.pitch.setAttribute('aria-valuetext', pitchWords(p));
  els.rate.setAttribute('aria-valuetext', rateWords(r));
  els.pitchOut.textContent = `${p} Hz`;
  els.rateOut.textContent = `${r} words per minute`;
}

function buildUI() {
  for (const [id, v] of Object.entries(VOICES)) els.voice.add(new Option(v.label, id));
  for (const [id, e] of Object.entries(EFFECTS)) els.effect.add(new Option(e.label, id));
  PRESETS.forEach((p, i) => {
    const label = document.createElement('label');
    label.className = 'preset';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'preset'; input.value = p.id; input.checked = i === 0;
    const name = document.createElement('span'); name.className = 'pname'; name.textContent = p.name;
    const about = document.createElement('span'); about.className = 'pabout'; about.textContent = p.about;
    label.append(input, name, about);
    els.list.append(label);
    input.addEventListener('change', () => { if (input.checked) choosePreset(p, true); });
  });
  choosePreset(PRESETS[0], false);
}

function choosePreset(p, speakName) {
  current.preset = p;
  const r = resolvePreset(p);
  els.voice.value = r.voice; els.effect.value = r.effect;
  els.pitch.value = r.pitch; els.rate.value = r.rate;
  els.effectAbout.textContent = EFFECTS[r.effect].about;
  syncSliderText();
  if (speakName && els.sayNames.checked) speak(p.name);
}

function settings() {
  return { voice: els.voice.value, effect: els.effect.value, pitch: +els.pitch.value, rate: +els.rate.value };
}

function stopAll() {
  els.player.pause();
  try { els.player.currentTime = 0; } catch (_) {}
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function speakDevice(text, s) {
  if (!('speechSynthesis' in window)) { announce('This browser has no device voice. Turn off the device voice option to use the retro voices.'); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = Math.min(2, Math.max(0, s.pitch / 150));
  u.rate = Math.min(3, Math.max(0.5, s.rate / 175));
  speechSynthesis.speak(u);
}

function render(text, s) {
  engine.setVoice(s.voice);
  engine.setRate(s.rate);
  engine.setPitch(s.pitch);
  const raw = engine.speak(text);
  return applyEffect(s.effect, raw, engine.sampleRate);
}

async function speak(text) {
  text = (text ?? els.text.value).trim();
  if (!text) { announce('Type something first.'); els.text.focus(); return; }
  stopAll();
  const s = settings();
  if (els.device.checked) { speakDevice(text, s); return; }
  if (!engine) { announce('The voice engine is still loading.'); return; }
  const samples = render(text, s);
  if (!samples.length) { announce('Nothing to say there.'); return; }
  lastWav = toWav(samples, engine.sampleRate);
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(new Blob([lastWav], { type: 'audio/wav' }));
  lastName = (current.preset?.id || 'jukebox') + '-' + s.voice + '-' + s.effect;
  els.save.disabled = false;
  els.player.src = lastUrl;
  try { await els.player.play(); }
  catch (e) { announce('Your browser blocked the sound. Press Speak again.'); }
}

function save() {
  if (!lastUrl) return;
  const a = document.createElement('a');
  a.href = lastUrl; a.download = lastName + '.wav';
  document.body.append(a); a.click(); a.remove();
  announce('Saved the last clip as a WAV file.');
}

function wire() {
  els.speak.addEventListener('click', () => speak());
  els.stop.addEventListener('click', () => { stopAll(); announce('Stopped.'); });
  els.save.addEventListener('click', save);
  els.pitch.addEventListener('input', syncSliderText);
  els.rate.addEventListener('input', syncSliderText);
  els.effect.addEventListener('change', () => { els.effectAbout.textContent = EFFECTS[els.effect.value].about; });
  els.voice.addEventListener('change', () => {
    const v = VOICES[els.voice.value];
    els.pitch.value = v.pitch; els.rate.value = v.rate; syncSliderText();
  });
  els.device.addEventListener('change', () => {
    els.effect.disabled = els.device.checked; els.voice.disabled = els.device.checked;
    announce(els.device.checked ? 'Device voice on. Retro effects are off.' : 'Retro voices on.');
  });
  document.querySelectorAll('.trick').forEach((b) => b.addEventListener('click', () => {
    els.text.value = b.dataset.text; els.text.focus();
    announce('Text added. Press Speak.');
  }));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); speak(); }
    else if (e.key === 'Escape') { stopAll(); }
  });
  if (navigator.audioSession) { try { navigator.audioSession.type = 'playback'; } catch (_) {} }
}

async function boot() {
  buildUI();
  wire();
  try {
    engine = await loadSharpVox(fetch(new URL('../engine/sharpvox.wasm', import.meta.url)));
    els.state.textContent = 'Voice engine ready. Pick a preset, then press Speak.';
    els.speak.disabled = false;
    window.__jukebox = { ready: true, render: (t, s) => render(t, { ...settings(), ...s }) };
  } catch (err) {
    console.error(err);
    els.state.textContent = 'The retro voice engine could not load in this browser. You can still use your device voice.';
    els.device.checked = true; els.device.dispatchEvent(new Event('change'));
    els.speak.disabled = false;
  }
}
boot();
