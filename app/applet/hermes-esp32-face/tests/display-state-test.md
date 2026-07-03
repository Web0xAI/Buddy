# Display State Test

## Goal
Confirm that all defined face states map correctly to physical display outputs and that the integration of `Face-for-Xiaozhi` is rendering cleanly (no tearing, correct colors).

## Steps
Send the following sequence of commands via the Serial Monitor (one by one, waiting 2 seconds between each):

1. `STATUS=IDLE;TEXT=Hermes Ready`
2. `STATUS=LISTENING;TEXT=Listening`
3. `STATUS=THINKING;TEXT=Thinking`
4. `STATUS=SPEAKING;TEXT=Speaking`
5. `STATUS=WORKER_BUSY;TEXT=Worker Busy`
6. `STATUS=ERROR;TEXT=Check Logs`
7. `STATUS=EMERGENCY_STOP;TEXT=Stopped`
8. `STATUS=OFFLINE;TEXT=Offline`

## Expected Outcome
- **IDLE**: Blinking, relaxed eyes.
- **LISTENING**: Eyes open wider, attentive.
- **THINKING**: Eyes looking up or darting slightly.
- **SPEAKING**: Mouth animation active (if supported by Face variant) or eyes animating to speech rhythm.
- **WORKER_BUSY**: Focused, narrowed eyes.
- **ERROR**: Sad or shocked eyes, reddish tint if supported.
- **EMERGENCY_STOP**: Warning indicator, strict face.
- **OFFLINE**: Eyes closed / sleeping.

If an exact animation does not exist in the base `Face-for-Xiaozhi` implementation, it falls back to the closest visual equivalent.
