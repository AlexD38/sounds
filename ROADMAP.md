# ROADMAP

- [x] Possibility to save more than 1 snapshot
- [x] Possibility to pass Perlin Noise into filter
- [x] Add undistinctive chattering Sound
- [x] Persist Wind creator params in snapshots / moods
- [x] Share mixes via URL + import/export JSON
- [x] Offline audio cache (IndexedDB + PWA runtime)
- [x] Local music fallback without Freesound key
- [x] Sleep timer gentle fade-out

## Next ideas

- [ ] **Day slots (morning / evening)** — Assign a mood or saved mix to morning and evening. Suggest-only chip (never auto-play) when the app opens in that period. Period from sunrise/sunset (Open-Meteo cache) or fallback hours 5–11 / 18–23. Dismiss for the day via sessionStorage. Lived briefly in Scenes → My mixes + top-left banner; deferred for later polish.
- [ ] **Capsules** — Chain 2–3 moods or saved mixes with per-step duration (5/15/30/60 min) and fade (2.5–20s). Simple editor in Scenes; runner crossfades between steps and fades to silence on the last. Chip shows step i/n with tap-to-cancel. Deferred for later polish.
- [ ] Rename saved mixes in-place
- [ ] Optional EQ / master compressor
- [ ] Self-host icon fonts (fully offline UI chrome)
