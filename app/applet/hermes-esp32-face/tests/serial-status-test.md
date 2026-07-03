# Serial Status Test

## Goal
Confirm that the ESP32 correctly receives and parses USB Serial commands from Hermes Desktop.

## Steps
1. Connect the ESP32 to the PC.
2. Open the serial monitor: `.\scripts\serial-monitor.ps1 -COMPort COM3`
3. Wait for the `DEVICE=READY` output in the log.
4. Type the following command and press Enter:
   `STATUS=THINKING;TEXT=Thinking`
5. Observe the ESP32 display. The face should transition to the 'Thinking' animation, and the text "Thinking" should appear.
6. Type the following command and press Enter:
   `STATUS=ERROR;TEXT=Check Logs`
7. Observe the ESP32 display. The face should transition to the 'Error/Alert' animation, and the text "Check Logs" should appear.

## Expected Outcome
The device accurately changes states instantly upon receiving a valid command format over the USB serial port.
