# Button Event Test

## Goal
Confirm that physical button presses on the ESP32 board correctly emit serial events back to Hermes Desktop.

## Steps
1. Connect the ESP32 to the PC.
2. Open the serial monitor: `.\scripts\serial-monitor.ps1 -COMPort COM3`
3. Short-press the physical `BOOT` button (or the primary configured GPIO button).
4. Long-press the button (hold for > 1.5 seconds).
5. Double-press the button rapidly.

## Expected Outcome
The serial monitor should output the following strings corresponding to your actions:
- `BUTTON=SHORT_PRESS`
- `BUTTON=LONG_PRESS`
- `BUTTON=DOUBLE_PRESS`

*(Note: Double press implementation depends on the base `xiaozhi-esp32` button driver capabilities. Short and Long presses are standard.)*
