# Buddy Avatar Project — Rig Layer Manifest v3

This version turns the Buddy asset project into an animation-ready rig reference system.

## Modes

### Normal Mode
Human-facing companion mode. Warm, soft, friendly, emotionally present.

### Chucky Mode
Visual transformation mode triggered by GibberTalk / AI-to-AI audio communication. Horror-comedy, sharp, mischievous, stitched, glitchy.

## New rig-layer folders

```text
assets/
  normal/
    rig_layers/
      mouth_shapes/
      eye_gaze/
      blink_frames/
      head_tilts/
  chucky/
    rig_layers/
      mouth_shapes/
      eye_gaze/
      blink_frames/
      head_tilts/
      scar_overlays/
      glitch_overlays/
```

## Normal Mode mouth shapes

```text
rest_closed
small_smile
wide_smile
open_smile
a_open
e_wide
o_round
u_small_round
mbp_closed_press
fv_lower_lip
concerned_curve
thinking_flat
```

## Chucky Mode mouth shapes

```text
evil_rest_grin
evil_closed_smirk
evil_teeth_grin
evil_open_grin
evil_side_smirk
evil_snarl
evil_laugh
evil_small_talk
evil_wide_talk
evil_round_talk
evil_hiss
evil_mbp
evil_fv
```

## Eye gaze positions

```text
center
left
right
up
down
up_left
up_right
down_left
down_right
```

## Blink frames

```text
blink_open
blink_half
blink_closed
blink_squint
```

## Head pose references

```text
neutral
tilt_left
tilt_right
nod_down
look_up
```

## Chucky-only overlays

### Scar overlays

```text
cheek_stitches
forehead_seam
mouth_corner_stitches
```

### Glitch overlays

```text
small_glitch
signal_bars
heavy_glitch
```

## Recommended production implementation

Use these SVGs as source references for either:

1. **Rive rig**, preferred.
2. **Layered SVG + React/Framer/GSAP**, acceptable.
3. **Canvas sprite/controller system**, workable if you want game-like behavior.

## Runtime state mapping

```text
waiting_for_user -> normal.idle
mic_active -> normal.listening
assistant_processing -> normal.thinking
assistant_speaking -> normal.talking
mic_blocked -> normal.concerned

gibbertalk_started -> chucky.transmission
gibbertalk_sending -> chucky.talking
gibbertalk_receiving -> chucky.evil_neutral
gibbertalk_peak -> chucky.wicked_grin
gibbertalk_ended -> chucky.recovery -> normal.idle
human_interrupt -> chucky.recovery -> normal.listening
```

## Next build step

The next artifact should be an **AI Studio implementation prompt** that tells the app builder to:

- import this project bundle
- use `rig_manifest.json`
- convert SVGs into layered avatar components
- connect app state events to avatar state
- animate Normal Mode and Chucky Mode separately
- use Chucky Mode only during GibberTalk
