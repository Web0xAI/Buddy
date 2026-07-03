# AI Studio Master Prompt — Buddy + GibberTalk + Chucky Mode Handoff

You are updating an existing AI Studio / React app project. You are being given multiple source packages that must be treated as one combined product direction.

## Core goal

Build the unified Buddy app.

Buddy should remain a simple human-facing companion app:

- The user opens the app.
- The user sees Buddy.
- The user talks to Buddy.
- Buddy talks back.
- Buddy stays helpful, friendly, and companion-like.

Do not rebuild the entire app from scratch unless absolutely required.

Use the existing Buddy app as the main app shell.

## Uploaded source packages

You have these source packages:

```text
source_projects/buddy_project_latest.zip
source_projects/buddy_project_alt_upload.zip
source_projects/gibbertalk_project.zip
avatar_assets/buddy_avatar_project_chucky_mode_v7.zip
reference_pngs/buddy_reference_pngs_v7.zip
```

Use `buddy_project_latest.zip` as the main Buddy app unless the alternate upload contains something clearly newer or more complete.

Use `gibbertalk_project.zip` only as the working GibberTalk / acoustic AI-to-AI protocol reference.

Use `buddy_avatar_project_chucky_mode_v7.zip` as the visual and behavior reference for Buddy Normal Mode and Chucky Mode.

Use `buddy_reference_pngs_v7.zip` only as visual reference PNGs to check that Buddy looks right.

## Product model

There are three major systems:

```text
Buddy App = main human-facing app
GibberTalk = hidden Buddy-to-Buddy / AI-to-AI acoustic communication layer
Chucky Mode = visual transformation Buddy enters while GibberTalk transmission is active
```

Important:

```text
GibberTalk is the behavior/protocol.
Chucky Mode is the visual mode.
Buddy remains the helpful companion.
```

## Main app decision

The Buddy project is the base app.

Keep from Buddy:

- existing voice conversation flow
- MiniMax chat proxy
- MiniMax TTS proxy
- microphone capture / SpeechRecognition flow
- response playback
- app state handling
- existing working talk/listen behavior

Do not replace the working Buddy voice system unless necessary.

## GibberTalk project role

The GibberTalk project is not the main UI.

Extract its useful protocol/audio pieces and adapt them into the Buddy project as a hidden background module.

Keep from GibberTalk:

- ggwave.js
- ggwave.wasm
- microphone acoustic decoding
- acoustic chirp encoding
- audio playback of encoded packets
- listener callback model
- any working start/stop listening methods
- any working send/play chirp logic

Do not bring over the terminal UI as the public Buddy UI.

Terminal/debug UI may exist only behind an optional debug mode.

## No UI cleanup pass first

Do not spend the first phase redesigning the visible UI.

The priority is to integrate the projects and establish the system architecture.

The current UI can stay mostly intact while the integration is completed, except where the Buddy avatar component needs to be replaced or extended.

## Avatar system

The avatar assets define two runtime visual modes:

```text
normal_mode = human-facing Buddy
chucky_mode = GibberTalk transmission Buddy
```

Use the v7 avatar package as the source of truth for mode taxonomy.

Chucky Mode is not just a single expression. Chucky Mode is the persistent visual wrapper for GibberTalk transmission.

Correct hierarchy:

```text
runtime_mode:
  normal_mode
  chucky_mode

normal_mode activities:
  idle
  greeting
  listening
  thinking
  speaking
  happy
  concerned
  empathetic
  confused

chucky_mode activities:
  entry_transform
  transmission_idle
  transmitting_send
  transmitting_receive
  coded_talking
  transmission_peak
  transmission_error
  recovery
```

## Runtime mode rules

Normal Mode:

- used for human-facing conversation
- Buddy is friendly
- Buddy listens to the human
- Buddy answers the human
- Buddy uses normal speaking/listening/thinking expressions

Chucky Mode:

- used only while GibberTalk is active
- Buddy is in AI-to-AI / Buddy-to-Buddy transmission mode
- Buddy shows the transformed Chucky Mode visuals
- Chucky Mode should always preserve some signal/transmission indicators while active:
  - subtle glitch aura
  - sharper eyes
  - stitched/scar face details
  - crooked grin baseline
  - rare uncanny blink
  - low signal pulse

Human interruption:

- if the human talks while Buddy is in Chucky Mode, immediately exit Chucky Mode through recovery and return to normal listening mode

## GibberTalk discovery concept

Buddy should eventually support an ambient Buddy-to-Buddy discovery layer.

Target concept:

```text
Buddy quietly listens for a GibberTalk ping.
Another Buddy nearby emits or responds to the ping.
Buddy detects another Buddy.
A Buddy-to-Buddy session opens.
Buddy enters Chucky Mode.
Buddies exchange GibberTalk acoustic packets.
When complete, Buddy exits Chucky Mode.
```

The first implementation may be simple and experimental.

## Recommended GibberTalk module structure

Add to the Buddy app:

```text
src/lib/gibbertalk/
  GibberTalkAudio.ts
  protocol.ts
  packetTypes.ts
  discovery.ts
  session.ts
  useGibberTalk.ts
```

`GibberTalkAudio.ts` should wrap the working ggwave/audio logic from the GibberTalk project.

Suggested events:

```text
onPingDetected
onBuddyDetected
onSessionStarted
onSending
onReceiving
onAudioBurst
onPeak
onError
onSessionEnded
```

## Recommended packet model

Use a packet model similar to:

```json
{
  "v": 1,
  "type": "ping",
  "sender": "buddy_abc123",
  "session": "s_789",
  "packet": "p_001",
  "ttl": 3,
  "payload": ""
}
```

Packet types:

```text
ping
pong
hello
ack
data
busy
end
error
```

Recommended flow:

```text
Buddy A -> ping
Buddy B -> pong
Buddy A -> hello
Buddy B -> ack
both enter Chucky Mode
A/B exchange data packets
A/B send ack packets
either sends end
both exit Chucky Mode
```

Avoid infinite loops by adding:

```text
senderId
packetId
sessionId
ttl
replyExpected
cooldownMs
ignoreOwnPackets
maxTurnsPerSession
```

## App state to add

Add runtime mode state to the Buddy app:

```ts
type RuntimeMode = "normal_mode" | "chucky_mode";

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

type ChuckyActivity =
  | "entry_transform"
  | "transmission_idle"
  | "transmitting_send"
  | "transmitting_receive"
  | "coded_talking"
  | "transmission_peak"
  | "transmission_error"
  | "recovery";
```

Connect events:

```text
app_loaded -> normal_mode.greeting
waiting_for_user -> normal_mode.idle
mic_active -> normal_mode.listening
user_speaking -> normal_mode.listening
assistant_processing -> normal_mode.thinking
assistant_speaking -> normal_mode.speaking
assistant_done -> normal_mode.idle
mic_permission_denied -> normal_mode.concerned

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

## Avatar implementation

Replace or extend the current BuddyFace component with a mode-aware avatar component:

```tsx
<BuddyAvatar
  runtimeMode={runtimeMode}
  normalActivity={normalActivity}
  chuckyActivity={chuckyActivity}
  mood={mood}
  isSpeaking={isSpeaking}
  isListening={isListening}
  audioLevel={audioLevel}
  gibbertalkActive={gibbertalkActive}
/>
```

Use the avatar v7 package for references.

Implementation can start with SVG expression swapping before building a fully rigged animation system.

Priority order:

1. normal Buddy looks like the improved Normal Mode reference
2. Chucky Mode looks like the improved Chucky Mode reference
3. runtimeMode switches correctly
4. GibberTalk events trigger Chucky Mode
5. speech/listening states still work
6. polish animation later

## Debug mode

Debug can exist, but it should be optional.

Use a hidden query param, hotkey, or long press:

```text
?debug=true
```

Debug panel can show:

```text
mic status
MiniMax status
GibberTalk status
last packet
runtimeMode
normalActivity
chuckyActivity
last decoded payload
audio level
```

Do not make the debug panel central to the normal app experience.

## Implementation phases

### Phase 1 — Inventory and safety

- Unpack Buddy project.
- Unpack GibberTalk project.
- Unpack avatar project.
- Identify frameworks, dependencies, scripts, and current working paths.
- Preserve the working Buddy voice loop.
- Preserve MiniMax backend routes.

### Phase 2 — Add avatar state model

- Add `runtimeMode`, `normalActivity`, and `chuckyActivity`.
- Keep existing moods if they are already used.
- Map existing Buddy states to Normal Mode activities.

### Phase 3 — Replace or extend BuddyFace

- Create `BuddyAvatar.tsx`.
- Use Normal Mode SVG for normal states.
- Use Chucky Mode SVG for GibberTalk states.
- Keep animation simple at first.
- Do not break voice interaction.

### Phase 4 — Extract GibberTalk module

- Copy ggwave files to Buddy public assets.
- Port the acoustic audio class into `src/lib/gibbertalk`.
- Create a hook: `useGibberTalk`.
- Add basic start/stop listening.
- Add send ping / receive ping behavior.

### Phase 5 — Connect GibberTalk to Chucky Mode

- ping detected -> optional visual signal
- session start -> chucky_mode.entry_transform
- sending -> chucky_mode.transmitting_send
- receiving -> chucky_mode.transmitting_receive
- audio burst -> chucky_mode.coded_talking
- session end -> chucky_mode.recovery
- human interrupt -> normal_mode.listening

### Phase 6 — Stability

- Prevent infinite ping loops.
- Add cooldowns.
- Add packet IDs.
- Add session timeout.
- Add fallback if ggwave fails to initialize.
- Keep normal Buddy conversation working even if GibberTalk is unavailable.

## Acceptance criteria

The integrated app is successful if:

- Buddy still talks to the human normally.
- Buddy visual is improved.
- Chucky Mode exists as a distinct visual mode.
- Chucky Mode means GibberTalk transmission is active.
- GibberTalk code is integrated as a hidden module.
- Basic ping/send/listen logic is present or scaffolded.
- Human interruption exits Chucky Mode.
- MiniMax chat/TTS still works.
- The project builds and runs.

## Do not do

- Do not turn Buddy into the GibberTalk terminal UI.
- Do not remove the working MiniMax voice loop.
- Do not make Chucky Mode appear during normal human conversation.
- Do not make transmission just one facial expression.
- Do not over-focus on UI cleanup in the first pass.
- Do not hardcode real secrets or API keys.
- Do not break existing server routes.
