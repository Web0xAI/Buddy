# Buddy Avatar Project — React/SVG Implementation Plan

## Alternative to Rive

If Rive is not used, build the avatar as a layered React/SVG component.

## Component structure

```tsx
<BuddyAvatar
  mode="normal | chucky"
  state="idle | listening | thinking | talking | concerned | transmission"
  lookX={number}
  lookY={number}
  blink={number}
  mouthShape={string}
  speechIntensity={number}
  glitchIntensity={number}
/>
```

## Suggested internal components

```tsx
<AvatarRoot>
  <TorsoLayer />
  <HeadLayer />
  <CapLayer />
  <HairLayer />
  <FaceLayer />
  <EyeLayer lookX lookY blink />
  <BrowLayer state mode />
  <NoseLayer />
  <FreckleLayer />
  <MouthLayer mode mouthShape speechIntensity />
  <ChuckyOverlayLayer active glitchIntensity />
</AvatarRoot>
```

## Animation libraries

Recommended:
- Framer Motion for simple React animation.
- GSAP for more detailed timelines.
- CSS keyframes for simple blink/breathing loops.

## Audio mouth driver

Use either:
1. real viseme timestamps if available
2. text heuristic based on generated response
3. audio amplitude fallback

## Chucky Mode rule

Chucky Mode should not reuse Normal mouth behavior. Use `coded_burst_mouth_ticks`.
