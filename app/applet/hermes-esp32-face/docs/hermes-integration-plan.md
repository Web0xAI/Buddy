# Hermes Integration Plan

## Purpose
This firmware acts as a physical face and audio interface for Hermes Desktop running on a Windows PC. The ESP32 is not the brain; Hermes is.

## Current Hook: USB Serial Protocol
The firmware listens on the USB Serial port for text commands. Hermes Desktop can open the COM port and send simple strings to control the display.

### Inbound Commands (Hermes -> ESP32)
Format: `STATUS=<STATE>;TEXT=<String>\n`
Examples:
- `STATUS=IDLE;TEXT=Hermes Ready\n`
- `STATUS=LISTENING;TEXT=Listening\n`
- `STATUS=THINKING;TEXT=Thinking\n`
- `STATUS=SPEAKING;TEXT=Speaking\n`

### Outbound Events (ESP32 -> Hermes)
The ESP32 will output lines to serial that Hermes can read:
- `DEVICE=READY` (On boot complete)
- `DEVICE=ERROR`
- `BUTTON=SHORT_PRESS`
- `BUTTON=LONG_PRESS`

## Future: WebSocket Hook
In the future, if Wi-Fi is enabled on the ESP32, it could connect to a local WebSocket server hosted by Hermes Desktop (`ws://<HERMES_IP>:<PORT>`). This allows untethered operation, sending audio streams and receiving display commands over the local network rather than USB.

## Future: Voice Integration
Hermes Desktop will process wake words and NLP. The ESP32 will simply stream microphone I2S data to Hermes (via Serial or WebSockets) and play back speaker data sent from Hermes. The heavy lifting (STT, LLM, TTS) happens on the Windows machine.
