# Buddy Avatar Project — Implementation Checklist

## Core objective

Turn Buddy into a two-mode animated companion avatar:

1. **Normal Mode** — warm, human-facing chat companion.
2. **Chucky Mode** — full horror-comedy transformation triggered by GibberTalk / AI-to-AI audio.

## Additions in v2

- PNG references for every SVG.
- Contact sheets for Normal Mode and Chucky Mode.
- Side-by-side mode comparison sheet.
- Clearer implementation checklist.

## Recommended build order

### Phase 1 — Drop-in references
Use the PNGs as visual references and SVGs as editable source assets.

### Phase 2 — Layered rig
Convert each SVG into separated controllable layers:
- cap
- hair
- eyes
- pupils
- eyelids
- brows
- nose
- freckles
- mouth
- clothing
- scars / glitch layers for Chucky Mode

### Phase 3 — Normal Mode state machine
Map app states:

```text
waiting_for_user -> normal.idle
mic_active -> normal.listening
assistant_processing -> normal.thinking
assistant_speaking -> normal.talking
mic_blocked -> normal.concerned
positive_moment -> normal.happy
```

### Phase 4 — Chucky Mode trigger
Map GibberTalk states:

```text
gibbertalk_started -> chucky.transmission
gibbertalk_sending -> chucky.talking
gibbertalk_receiving -> chucky.evil_neutral
gibbertalk_peak -> chucky.wicked_grin
gibbertalk_ended -> chucky.recovery -> normal.idle
human_interrupt -> chucky.recovery -> normal.listening
```

### Phase 5 — Mouth system
Normal Mode should use human-friendly mouth visemes.
Chucky Mode should use sharper, coded, grin-heavy mouth ticks.

### Phase 6 — Eye system
Normal Mode:
- soft gaze
- natural blink
- friendly eye contact

Chucky Mode:
- sharper stare
- eye darts
- lower blink frequency
- glare / up-look behavior

## Highest-value next asset addition

Create a dedicated `mouth_shapes/` folder for both modes.

Normal Mode mouth set:
- rest_closed
- small_smile
- open_smile
- a_open
- e_wide
- o_round
- u_small_round
- mbp_closed_press
- fv_lower_lip
- concerned_curve

Chucky Mode mouth set:
- evil_rest_grin
- evil_teeth_grin
- evil_open_grin
- evil_side_smirk
- evil_snarl
- evil_laugh
- evil_small_talk
- evil_wide_talk
- evil_round_talk
- evil_hiss
