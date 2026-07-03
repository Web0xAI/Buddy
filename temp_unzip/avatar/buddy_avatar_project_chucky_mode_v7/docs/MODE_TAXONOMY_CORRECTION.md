# Buddy Avatar Project — Mode Taxonomy Correction v7

## Core correction

**Chucky Mode is the GibberTalk transmission mode.**

That means `transmission` should not be treated as one random expression next to talking, snarl, or wicked grin.

The correct hierarchy is:

```text
runtime_mode
  normal_mode
  chucky_mode

activity_state
  normal: idle, listening, thinking, speaking, concerned
  chucky: entry_transform, transmission_idle, transmitting_send, transmitting_receive, coded_talking, transmission_peak, recovery

expression_asset
  actual SVG face/body asset used for that activity
```

## Correct interpretation

```text
GibberTalk active = chucky_mode
chucky_mode = Buddy is in GibberTalk transmission
```

Inside Chucky Mode, Buddy can still have different visual activities:

```text
entry_transform
transmission_idle
transmitting_send
transmitting_receive
coded_talking
transmission_peak
transmission_error
recovery
```

But all of these are still part of **GibberTalk transmission**.

## Why this matters

Before v7, the project implied:

```text
chucky.transmission = one expression
```

That is too narrow.

The corrected model is:

```text
chucky_mode = persistent GibberTalk transmission mode
buddy_chucky_transmission.svg = high-signal visual asset used during active transmission moments
```

## Runtime rule

```text
if isGibberTalkTransmissionActive:
    runtime_mode = "chucky_mode"
else:
    runtime_mode = "normal_mode"
```

## Recommended app state variables

```ts
type RuntimeMode = "normal_mode" | "chucky_mode";

type ChuckyActivity =
  | "entry_transform"
  | "transmission_idle"
  | "transmitting_send"
  | "transmitting_receive"
  | "coded_talking"
  | "transmission_peak"
  | "transmission_error"
  | "recovery";

type NormalActivity =
  | "idle"
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "concerned"
  | "empathetic"
  | "confused";
```

## Trigger map

```text
gibbertalk_started -> chucky_mode.entry_transform
gibbertalk_channel_open -> chucky_mode.transmission_idle
gibbertalk_sending -> chucky_mode.transmitting_send
gibbertalk_receiving -> chucky_mode.transmitting_receive
gibbertalk_audio_burst -> chucky_mode.coded_talking
gibbertalk_peak -> chucky_mode.transmission_peak
gibbertalk_error -> chucky_mode.transmission_error
gibbertalk_ended -> chucky_mode.recovery -> normal_mode.idle
human_interrupt -> chucky_mode.recovery -> normal_mode.listening
```

## Practical design consequence

Chucky Mode should always visually signal that Buddy is inside a GibberTalk transmission channel, even if he is not actively speaking at that exact moment.

So Chucky Mode should always keep some transmission markers alive:

- subtle glitch aura
- sharper eyes
- darker face
- visible scars/stitches
- crooked grin baseline
- rare uncanny blink
- low signal pulse

The intensity changes by activity, but the **transmission identity stays on**.
