// Run: node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharpVox } from '../js/sharpvox-engine.js';
import { applyEffect, EFFECTS, toWav } from '../js/effects.js';
import { PRESETS, VOICES, resolvePreset } from '../js/presets.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('page basics', () => {
  const html = read('index.html');
  assert.match(html, /<title>Retro Voice Jukebox<\/title>/);
  assert.match(html, /name="viewport"/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.equal((html.match(/aria-live=/g) || []).length, 1, 'exactly one live region');
  assert.doesNotMatch(html, /<table|<dl|aria-describedby|autoplay/);
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^https?:/.test(m[1])) { assert.match(m[1], /github\.com/); continue; }
    assert.ok(fs.existsSync(path.join(root, m[1])), 'missing local asset ' + m[1]);
  }
  assert.doesNotMatch(html + read('credits.html') + read('README.md'), /Hasan|Altameemi|Looscid|TODO|lorem/i);
});

test('credits and licenses', () => {
  assert.ok(fs.existsSync(path.join(root, 'LICENSE')));
  assert.match(read('NOTICE'), /ByteSizedFox/);
  assert.match(read('licenses/SharpVoxTTS-MIT.txt'), /MIT License/);
  const c = JSON.parse(read('credits.json'));
  assert.equal(c.credits[0].license, 'MIT');
  assert.match(read('credits.html'), /smoothTalker-sbaitso/);
});

test('every preset renders real audio through every effect', async () => {
  const sv = await loadSharpVox(fs.readFileSync(path.join(root, 'engine/sharpvox.wasm')));
  assert.equal(sv.sampleRate, 22050);
  for (const p of PRESETS) {
    const r = resolvePreset(p);
    assert.ok(VOICES[r.voice] && EFFECTS[r.effect], p.id);
    assert.ok(sv.setVoice(r.voice));
    sv.setRate(r.rate); sv.setPitch(r.pitch);
    const out = applyEffect(r.effect, sv.speak(p.name), sv.sampleRate);
    assert.ok(out.length > sv.sampleRate * 0.3, p.id + ' too short');
    let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
    assert.ok(peak > 0.5 && peak <= 1, p.id + ' peak ' + peak);
  }
  sv.setVoice('john'); sv.setRate(158); const slow = sv.speak('the quick brown fox').length;
  sv.setRate(350); const fast = sv.speak('the quick brown fox').length;
  assert.ok(fast < slow * 0.7, 'speed slider changes duration');
  const wav = toWav(new Float32Array(10), 22050);
  assert.equal(wav.byteLength, 64);
});
