# Buddy Avatar Project — QA Acceptance Tests

## Visual QA

### Normal Mode
- Buddy has blue cap, blue eyes, brown bangs, freckles, soft face.
- Buddy does not look robotic or corporate.
- Buddy is readable at mobile size.
- Buddy looks friendly in idle/listening/talking.

### Chucky Mode
- Chucky Mode looks like a full transformation, not a recolor.
- Chucky Mode keeps Buddy identity anchors.
- Chucky Mode has sharp eyes, hard brows, teeth, scars/stitches, glitch overlays.
- Chucky Mode is only shown during GibberTalk.

## Behavior QA

### Normal Mode
- Idle does not freeze.
- Listening feels attentive.
- Thinking looks intentional.
- Talking mouth movement is not simple open/close flapping.
- Concerned state is soft, not angry.

### Chucky Mode
- Entry feels like an event.
- Mouth behavior feels coded and weird.
- Eyes dart or stare more sharply.
- Glitch overlays activate only in Chucky Mode.
- Exit returns to friendly Buddy.

## App event QA

```text
app_loaded -> normal.greeting
mic_active -> normal.listening
assistant_processing -> normal.thinking
assistant_speaking -> normal.talking
gibbertalk_started -> chucky.entry
gibbertalk_sending -> chucky.talking
human_interrupt -> normal.listening
gibbertalk_ended -> normal.idle
```

## Failure conditions

The build fails if:
- Chucky Mode appears during normal human chat.
- Normal Mode looks scary.
- Chucky Mode is too subtle.
- Mouth movement is just open/close.
- Eyes stay dead-center forever.
- There is no visible mode transition.
