# Hermes ESP32 Face

This is a custom ESP32 companion firmware for Hermes Desktop, acting as the local physical interface. 

Hermes Desktop runs on the Windows machine and is the brain of the operation. This ESP32 firmware provides:
- An animated face/status display
- Basic device status states
- Local communication hooks via USB serial command protocol for Hermes Desktop

## Base Projects Used
- **Base Firmware**: `xiaozhi-esp32` (https://github.com/78/xiaozhi-esp32.git)
- **Face/Display Integration**: `Face-for-Xiaozhi` (https://github.com/TechTalkies/Face-for-Xiaozhi.git)

## What's Changed
- Integrated Face-for-Xiaozhi into the base xiaozhi-esp32 firmware.
- Added Hermes-branded status states mapped to the face/display logic.
- Implemented a local serial command protocol hook (`hermes_status_protocol`) for Hermes Desktop to control the device state.
- Removed cloud-first dependencies as the core path; prepared the project for local Hermes Desktop control.

## Getting Started

1. **Hardware Selection**: Read `docs/board-selection.md` for target board recommendations.
2. **Build Environment**: Follow `docs/windows-build-guide.md` to set up ESP-IDF on Windows.
3. **Flashing**: Read `docs/flashing-guide.md` and use the scripts in `scripts/`.
4. **Testing**: Follow the test plan in `tests/`.
