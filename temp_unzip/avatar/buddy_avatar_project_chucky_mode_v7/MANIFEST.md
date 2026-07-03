# Buddy Avatar Project Manifest

This project contains two complete visual modes for Buddy:

1. **Normal Mode** — friendly human-facing companion avatar.
2. **Chucky Mode** — full horror-comedy transformation used during GibberTalk / AI-to-AI communication.

## Folder structure

```text
buddy_avatar_project_chucky_mode/
  manifest.json
  MANIFEST.md
  specs/
    normal_mode_spec.md
    chucky_mode_spec.md
  assets/
    normal/
      master/
        buddy_normal_master.svg
      expressions/
        buddy_normal_idle.svg
        buddy_normal_happy.svg
        buddy_normal_listening.svg
        buddy_normal_thinking.svg
        buddy_normal_talking.svg
        buddy_normal_concerned.svg
    chucky/
      master/
        buddy_chucky_master.svg
      expressions/
        buddy_chucky_evil_neutral.svg
        buddy_chucky_wicked_grin.svg
        buddy_chucky_talking.svg
        buddy_chucky_laughing.svg
        buddy_chucky_snarl.svg
        buddy_chucky_transmission.svg
        buddy_chucky_recovery.svg
```

## Core rule

**GibberTalk is the behavior trigger. Chucky Mode is the visual transformation.**

```text
GibberTalk starts -> Chucky Mode
Human interrupts -> return to Normal Mode
GibberTalk ends -> Chucky Recovery -> Normal Mode
```

## Recommended next implementation step

Convert these SVG references into a proper layered rig:
- Rive, preferred
- or layered SVG + React/Framer/GSAP

Use `manifest.json` as the integration contract.


## v2 additions

```text
references/
  png/
    normal/
    chucky/
  contact_sheets/
    normal_contact_sheet.png
    chucky_contact_sheet.png
    mode_comparison_sheet.png
docs/
  implementation_checklist.md
```

## Next recommended build artifacts

1. Dedicated mouth shape SVGs for both modes.
2. Eye gaze direction SVGs.
3. Blink frame SVGs.
4. Head tilt pose SVGs.
5. Rive-ready layer map.
6. App implementation prompt.


## v4 additions — animation behavior layer

```text
animation/
  animation_state_machine.json
  behavior_rules.json
  timing_presets.json
  viseme_mapping.json
  presets/
    emotion_presets.json

docs/
  ANIMATION_BEHAVIOR_SPEC.md
  RIVE_IMPLEMENTATION_PLAN.md
  REACT_SVG_IMPLEMENTATION_PLAN.md

tests/
  QA_ACCEPTANCE_TESTS.md
```

## v4 purpose

v4 connects the visual assets to runtime behavior.

The project now has:
- source SVGs
- PNG references
- rig layer assets
- mode specs
- state machine logic
- mouth/viseme mapping
- emotion presets
- timing rules
- QA tests


## v5 additions — Normal Buddy SVG polish

v5 improves the friendly Buddy SVG itself:
- stronger body/overalls
- clearer rainbow shirt
- better cap and bangs
- softer face
- brighter eyes
- cleaner normal expression set

See:
```text
docs/V5_NORMAL_BUDDY_POLISH.md
references/contact_sheets/normal_contact_sheet.png
```


## v6 additions — Chucky Mode SVG polish

v6 improves the Chucky Mode transformation SVGs:
- stronger Chucky body silhouette
- darker contrast
- more aggressive eyes/brows
- better teeth and grin shapes
- more visible scars/stitches
- stronger glitch aura

See:
```text
docs/V6_CHUCKY_MODE_POLISH.md
references/contact_sheets/chucky_contact_sheet.png
references/contact_sheets/mode_comparison_sheet.png
```


## v7 correction — Mode taxonomy

v7 corrects the runtime model:

```text
Chucky Mode = persistent GibberTalk transmission mode
```

This means `transmission` is not just one visual expression.  
Every Chucky Mode activity is inside the GibberTalk transmission wrapper.

New files:

```text
animation/mode_taxonomy.json
animation/animation_state_machine_v7.json
docs/MODE_TAXONOMY_CORRECTION.md
docs/STATE_MAP_V7.md
```
