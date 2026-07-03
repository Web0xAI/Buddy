# Flashing Guide

Once you have successfully built the firmware, you need to flash it to your ESP32 board.

## Flashing via ESP-IDF

If you are using the ESP-IDF Command Prompt:

1. Connect your ESP32 board via USB.
2. Determine your COM port (e.g., `COM3`).
3. Run the flash command:
   ```cmd
   idf.py -p COM3 flash monitor
   ```
   *(The `monitor` flag will immediately open the serial monitor after flashing).*

## Flashing via Helper Script

We provide a PowerShell script for convenience:

1. Open a PowerShell terminal.
2. Run the script:
   ```powershell
   .\scripts\flash.ps1 -COMPort COM3
   ```

## Troubleshooting Flashing

- **Permission Denied / Port in Use**: Make sure no other serial monitor (like PuTTY or Arduino IDE) is connected to the COM port.
- **Bootloader Mode**: Some ESP32 boards require you to hold the `BOOT` button while plugging it in or right when the flashing process starts to enter download mode.
