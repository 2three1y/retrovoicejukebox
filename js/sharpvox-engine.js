// SharpVox engine loader for Retro Voice Jukebox.
// SharpVox is MIT-licensed (c) 2026 ByteSizedFox, from the starred repo dectalk/SharpVoxTTS.
// This file is a tiny loader: it gives the wasm build the four WASI calls it needs and
// wraps the exported C functions. It runs in a Web Worker or in Node for tests.
export async function loadSharpVox(wasmBytesOrResponse) {
  let memory;
  const enc = new TextEncoder();
  const wasi = {
    fd_write(fd, iovs, iovsLen, nwrittenPtr) {
      const v = new DataView(memory.buffer);
      let n = 0;
      for (let i = 0; i < iovsLen; i++) n += v.getUint32(iovs + i * 8 + 4, true);
      v.setUint32(nwrittenPtr, n, true);
      return 0;
    },
    fd_close() { return 0; },
    fd_seek() { return 70; },
    proc_exit(code) { throw new Error('SharpVox exited with code ' + code); },
  };
  const imports = { wasi_snapshot_preview1: wasi };
  let instance;
  if (wasmBytesOrResponse instanceof ArrayBuffer || ArrayBuffer.isView(wasmBytesOrResponse)) {
    ({ instance } = await WebAssembly.instantiate(wasmBytesOrResponse, imports));
  } else {
    const resp = await wasmBytesOrResponse;
    const buf = await resp.arrayBuffer();
    ({ instance } = await WebAssembly.instantiate(buf, imports));
  }
  const ex = instance.exports;
  memory = ex.memory;
  const sampleRate = ex.sv_init();
  function withString(str, fn) {
    const bytes = enc.encode(str + '\0');
    const p = ex.sv_alloc(bytes.length);
    new Uint8Array(memory.buffer, p, bytes.length).set(bytes);
    try { return fn(p); } finally { ex.sv_free(p); }
  }
  return {
    sampleRate,
    setVoice(name) { return withString(name, (p) => ex.sv_voice(p)) === 1; },
    setRate(wpm) { ex.sv_rate(Math.round(wpm)); },
    setPitch(hz) { ex.sv_pitch(Math.round(hz)); },
    getRate() { return ex.sv_get_rate(); },
    getPitch() { return ex.sv_get_pitch(); },
    // Returns Float32Array samples (mono) at sampleRate.
    speak(text) {
      const n = withString(text, (p) => ex.sv_speak(p));
      const ptr = ex.sv_buf();
      const pcm = new Int16Array(memory.buffer, ptr, n);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = pcm[i] / 32768;
      return out;
    },
  };
}
