# Buddy Avatar Project — Animation Behavior Spec v4

## Purpose

This document defines the runtime behavior layer for Buddy's animated avatar system.

The project now has:

1. SVG/PNG visual references.
2. Rig-layer asset folders.
3. Mode-specific mouth, eye, blink, head, scar, and glitch assets.
4. Runtime animation state machine.
5. Viseme mapping.
6. Timing presets.
7. Emotion presets.
8. Behavior rules.

## Core principle

Buddy is not a static image. Buddy is a state-driven animated companion.

## Two visual modes

### Normal Mode

Used for human-facing interaction.

Normal Mode should feel:
- warm
- present
- attentive
- soft
- friendly
- emotionally connected

### Chucky Mode

Used only during GibberTalk / AI-to-AI audio communication.

Chucky Mode should feel:
- funny
- creepy
- sharp
- coded
- mischievous
- like a full transformation event

## Runtime control priority

```text
human_interrupt > safety/error state > GibberTalk state > speaking state > listening state > idle
```

## Normal Mode state logic

```text
app_loaded -> greeting
waiting_for_user -> idle
mic_active -> listening
user_speaking -> listening
user_finished -> thinking
assistant_processing -> thinking
assistant_speaking -> talking
assistant_done -> idle
mic_permission_denied -> concerned
```

## Chucky Mode state logic

```text
gibbertalk_started -> chucky.entry
gibbertalk_sending -> chucky.talking
gibbertalk_receiving -> chucky.evil_neutral
gibbertalk_peak -> chucky.wicked_grin
gibbertalk_transmission -> chucky.transmission
gibbertalk_ended -> chucky.recovery -> normal.idle
human_interrupt -> chucky.recovery -> normal.listening
```

## Expression transition rules

- No hard cuts unless intentionally doing a Chucky Mode glitch snap.
- Normal expression blends should take about 250ms.
- Chucky entry should feel like a 900ms transformation event.
- Chucky exit should feel like a 1100ms recovery back into friendly Buddy.

## Mouth behavior

### Normal Mode

Use natural viseme-style mouth motion:
- smoother
- softer
- human-friendly
- phrase ends close into a smile

### Chucky Mode

Use coded burst mouth motion:
- faster
- sharper
- grin-heavy
- jagged
- weird
- phrase ends hold into a sinister grin

## Eye behavior

### Normal Mode
- natural blink
- soft gaze drift
- direct eye contact when listening
- looking away only for thinking/confusion

### Chucky Mode
- reduced blinking
- sharp eye darts
- intense stare locks
- occasional glitch pulse
- eyes should feel like an AI backchannel is active

## Human interruption rule

If the user speaks or interacts during Chucky Mode, Buddy should immediately begin recovery and return to Normal Mode.

This keeps Buddy's human-facing relationship primary.
