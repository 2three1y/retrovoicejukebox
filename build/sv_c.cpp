
// Retro Voice Jukebox: tiny C ABI around SharpVox (MIT, ByteSizedFox) for a plain wasm32 build.
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <string>
#include <vector>
#include "../platform/lib/SharpVox.h"
#include "../include/VoicePresets.h"
#include "../include/VoiceData.h"

using namespace SharpVox;
static SharpVoxSpeaker* g_sp = nullptr;
static std::vector<int16_t> g_out;

extern "C" {
__attribute__((export_name("sv_init"))) int sv_init() {
  if (!g_sp) g_sp = new SharpVoxSpeaker();
  return g_sp->SampleRate;
}
__attribute__((export_name("sv_alloc"))) void* sv_alloc(int n) { return std::malloc(n); }
__attribute__((export_name("sv_free"))) void sv_free(void* p) { std::free(p); }
__attribute__((export_name("sv_voice"))) int sv_voice(const char* name) {
  sv_init();
  VoiceData v;
  if (!VoicePresets::TryGet(std::string(name), v)) return 0;
  g_sp->ApplyVoiceData(v);
  return 1;
}
__attribute__((export_name("sv_rate"))) void sv_rate(int r) { sv_init(); g_sp->Rate = r; g_sp->ApplyVoiceInPlace(); }
__attribute__((export_name("sv_pitch"))) void sv_pitch(int hz) { sv_init(); g_sp->PitchHz = hz; g_sp->ApplyVoiceInPlace(); }
__attribute__((export_name("sv_get_rate"))) int sv_get_rate() { sv_init(); return g_sp->Rate; }
__attribute__((export_name("sv_get_pitch"))) int sv_get_pitch() { sv_init(); return g_sp->PitchHz; }
static void on_buf(SharpVoxSpeaker*, const int16_t* buf, int32_t len, void*) {
  g_out.insert(g_out.end(), buf, buf + len);
}
__attribute__((export_name("sv_speak"))) int sv_speak(const char* text) {
  sv_init();
  g_out.clear();
  g_sp->Speak(std::string(text), on_buf, nullptr);
  return (int)g_out.size();
}
__attribute__((export_name("sv_buf"))) const int16_t* sv_buf() { return g_out.data(); }
__attribute__((export_name("sv_buf_len"))) int sv_buf_len() { return (int)g_out.size(); }
}
int main() { return 0; }
