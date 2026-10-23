# Engine build

The voice engine is SharpVox (MIT, dectalk/SharpVoxTTS) compiled to a plain wasm32 module with Zig 0.14.1.

- `sv_c.cpp` is the tiny C wrapper the page calls (set voice, rate, pitch, render text to 16-bit PCM).
- `sharpvox-jukebox.patch` is every change made to upstream files, all to remove C++ exceptions.
- `build-wasm.sh` applies both and builds `engine/sharpvox.wasm`.

The module needs only four WASI imports (fd_write, fd_close, fd_seek, proc_exit), which `js/sharpvox-engine.js` stubs out, so no Emscripten runtime is shipped.
