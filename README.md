# Retro Voice Jukebox

Type anything and hear it in old-school formant computer voices, right in the browser. No account, no server, works with VoiceOver.

Live: https://2three1y.github.io/retro-voice-jukebox/

## What it does
- 13 presets, each says its own name when you pick it: Sound Card '91, Klatt John, Klatt Beth, Robot Overlord, Arcade Cabinet, Telephone Operator, Walkie-Talkie, Space Station and more.
- Fine-tune: 10 voices, 7 effects ('90s sound card, robot, bitcrush, telephone, walkie-talkie, echo), pitch and speed sliders that VoiceOver reads in plain words.
- Save any clip as a WAV file.
- Secret tricks: the engine can sing, like `[dow<500,C4>rey<500,D4>miy<500,E4>]`.
- Option to use your device's own voice instead (the browser does not allow effects on it).
- Keyboard: Control or Command plus Enter speaks, Escape stops.

## Honest note about the voices
Every voice comes from SharpVox, an open source (MIT) formant synthesizer in the DECtalk tradition, compiled to WebAssembly. The original Dr. Sbaitso, SoftVoice, SAM and DECtalk engines are not included: their code is proprietary or unlicensed. "Sound Card '91" is a tribute, not the real Sbaitso. See CREDITS.md.

## Credits
See CREDITS.md and credits.html. Built only from repos starred by 2three1y.

## License
MIT, Carter (2three1y). SharpVox is MIT, (c) ByteSizedFox; see NOTICE.
