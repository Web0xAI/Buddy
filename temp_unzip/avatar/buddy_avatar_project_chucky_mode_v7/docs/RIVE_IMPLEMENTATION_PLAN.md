# Buddy Avatar Project — Rive Implementation Plan

## Recommendation

Use Rive for the production version if possible.

Rive is ideal because Buddy needs:
- state machines
- expression blending
- input controls
- mouth states
- blink loops
- eye direction
- Chucky Mode transformation
- lightweight app runtime

## Suggested Rive inputs

```text
mode: normal | chucky
state: idle | listening | thinking | talking | concerned | transmission
lookX: -1 to 1
lookY: -1 to 1
blink: 0 to 1
mouthOpen: 0 to 1
mouthShape: enum
smile: 0 to 1
browConcern: 0 to 1
browAngle: 0 to 1
eyeGlow: 0 to 1
glitchIntensity: 0 to 1
headTilt: -1 to 1
headNod: -1 to 1
speechIntensity: 0 to 1
```

## State machines

### Normal machine
- idle
- greeting
- listening
- thinking
- talking
- happy
- concerned
- empathetic
- confused

### Chucky machine
- entry
- evil_neutral
- wicked_grin
- talking
- laughing
- snarl
- transmission
- recovery

## Asset import strategy

Import the SVG layers as grouped parts:
- head
- cap
- hair
- eyes
- pupils
- eyelids
- brows
- mouth
- neck
- torso
- chucky scars
- chucky glitch overlays

## Build order

1. Import Normal Mode master.
2. Split face components.
3. Add blink.
4. Add eye gaze.
5. Add mouth shapes.
6. Add Normal state machine.
7. Import Chucky Mode overlays.
8. Add Chucky state machine.
9. Wire app events to Rive inputs.
10. Add audio-driven mouth control.
