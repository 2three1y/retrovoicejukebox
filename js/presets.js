// Jukebox presets. Every voice comes from the SharpVox formant engine
// (MIT, dectalk/SharpVoxTTS). None of these is the original Dr. Sbaitso,
// SoftVoice, SAM or DECtalk engine; the tribute presets say so.
export const VOICES = {
  john: { label: 'John', rate: 158, pitch: 121 },
  beth: { label: 'Beth', rate: 162, pitch: 238 },
  chris: { label: 'Chris', rate: 162, pitch: 138 },
  deborah: { label: 'Deborah', rate: 148, pitch: 168 },
  jack: { label: 'Jack', rate: 155, pitch: 155 },
  jess: { label: 'Jess', rate: 166, pitch: 218 },
  matt: { label: 'Matt', rate: 154, pitch: 86 },
  tommy: { label: 'Tommy', rate: 164, pitch: 318 },
  pirate: { label: 'Pirate', rate: 178, pitch: 141 },
  whisper: { label: 'Whisper', rate: 148, pitch: 175 },
};

export const PRESETS = [
  { id: 'soundcard91', name: "Sound Card '91", voice: 'john', effect: 'soundcard', rate: 150, pitch: 100,
    about: "A tribute to early-90s sound card talkers like Dr. Sbaitso. It is not the real Sbaitso engine." },
  { id: 'klatt-john', name: 'Klatt John', voice: 'john', effect: 'clean', about: 'The SharpVox formant voice John, clean. Very DECtalk-era.' },
  { id: 'klatt-beth', name: 'Klatt Beth', voice: 'beth', effect: 'clean', about: 'SharpVox voice Beth, clean.' },
  { id: 'robot', name: 'Robot Overlord', voice: 'jack', effect: 'robot', rate: 140, pitch: 110, about: 'Jack through a ring modulator and a metal tube.' },
  { id: 'arcade', name: 'Arcade Cabinet', voice: 'tommy', effect: 'bitcrush', rate: 170, about: 'Tommy, crunched down to 4 bits.' },
  { id: 'operator', name: 'Telephone Operator', voice: 'beth', effect: 'telephone', about: 'Beth on an old phone line.' },
  { id: 'walkie', name: 'Walkie-Talkie', voice: 'matt', effect: 'radio', rate: 165, about: 'Matt on a crackly radio. Over.' },
  { id: 'station', name: 'Space Station', voice: 'deborah', effect: 'echo', about: 'Deborah in a huge echoing hall.' },
  { id: 'chris', name: 'Chris', voice: 'chris', effect: 'clean', about: 'SharpVox voice Chris.' },
  { id: 'jess', name: 'Jess', voice: 'jess', effect: 'clean', about: 'SharpVox voice Jess.' },
  { id: 'matt', name: 'Deep Matt', voice: 'matt', effect: 'clean', about: 'SharpVox voice Matt, the lowest one.' },
  { id: 'pirate', name: 'Pirate', voice: 'pirate', effect: 'clean', about: 'SharpVox voice Pirate. Arr.' },
  { id: 'whisper', name: 'Whisper', voice: 'whisper', effect: 'clean', about: 'SharpVox voice Whisper, breathy and quiet.' },
];

export function resolvePreset(p) {
  const v = VOICES[p.voice];
  return { voice: p.voice, effect: p.effect, rate: p.rate ?? v.rate, pitch: p.pitch ?? v.pitch };
}
