# Upstream Notes

## Repositories Used
1. `xiaozhi-esp32` by 78 (Base firmware for ESP32)
2. `Face-for-Xiaozhi` by TechTalkies (Face/display animations)

## Modified/Copied Files
- `Face-for-Xiaozhi` files were integrated into the display rendering pipeline of `xiaozhi-esp32` (typically inside the `main/display` or UI component directory).
- A new `hermes_status_protocol` module was injected to override the default cloud-driven state machine, allowing state injection via USB Serial.

## Important Upstream Assumptions
- `xiaozhi-esp32` heavily assumes the presence of a Wi-Fi connection and an active connection to an AI/Voice server. These behaviors have been bypassed or made optional to prioritize local USB serial control for Hermes.
- The I2S audio pipeline remains intact for microphone/speaker usage, but voice processing is expected to be handled by Hermes Desktop.
- The `Face-for-Xiaozhi` rendering logic requires an LVGL-compatible display buffer, which the base firmware provides.

## License Notes
- Original headers and license files from `xiaozhi-esp32` have been retained in the `firmware/xiaozhi` directory.
