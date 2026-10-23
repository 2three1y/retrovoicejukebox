#!/usr/bin/env bash
# Rebuild engine/sharpvox.wasm from upstream SharpVox with Zig (any recent Zig with wasm32-wasi).
# Usage: ./build/build-wasm.sh /path/to/SharpVoxTTS-checkout
set -euo pipefail
SRC="${1:?path to a SharpVoxTTS checkout at commit 62528bc}"
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$SRC"
patch -p1 < "$HERE/sharpvox-jukebox.patch"
mkdir -p jukebox && cp "$HERE/sv_c.cpp" jukebox/sv_c.cpp
FILES="src/Tables.cpp src/KlattSynthesizerFP.cpp src/PitchInterpolator.cpp src/AudioProcessor.cpp src/SpeechRenderer.cpp src/TtsEngine.cpp src/Phonemizer.cpp src/LetterToSound.cpp src/DictionaryReader.cpp src/LibraryDataDictionary.cpp src/LibraryDataSymbols.cpp src/Morphology.cpp src/HeteronymResolver.cpp src/TextCommands.cpp src/KlattschParser.cpp src/VoicePresets.cpp src/JapaneseParser.cpp platform/lib/SharpVox.cpp jukebox/sv_c.cpp"
zig c++ -target wasm32-wasi -std=c++17 -O2 -Iinclude -fno-exceptions $FILES -o sharpvox.wasm -Wl,--strip-all
cp sharpvox.wasm "$HERE/../engine/sharpvox.wasm"
echo "Built engine/sharpvox.wasm"
