# Buddy + GibberTalk Merge Plan

## Decision

Use the Buddy app as the main project.

Use the GibberTalk project as the audio/protocol donor.

Use the Buddy Avatar Project v7 as the visual/behavior reference.

## Package roles

```text
buddy_project_latest.zip
  Main app shell.
  Keep voice, MiniMax, TTS, SpeechRecognition, current app structure.

gibbertalk_project.zip
  Protocol reference.
  Extract ggwave acoustic send/listen logic.

buddy_avatar_project_chucky_mode_v7.zip
  Visual + behavior reference.
  Contains Normal Mode, Chucky Mode, mode taxonomy, state maps.

buddy_reference_pngs_v7.zip
  Visual review package.
  Used to inspect Normal Buddy and Chucky Mode references quickly.
```

## No first-pass UI cleanup

The handoff intentionally does not prioritize UI cleanup.

First-pass priority:

1. integrate the projects
2. preserve working Buddy voice behavior
3. add mode taxonomy
4. add Chucky Mode / GibberTalk linkage
5. keep the app running

UI cleanup can happen later.
