# Windows Build Guide

## Prerequisites

1. **Git**: Ensure Git for Windows is installed.
2. **Python**: Python 3.8+ is required by ESP-IDF.
3. **ESP-IDF**: version 5.x (check `firmware/xiaozhi/README.md` for the exact recommended version by the upstream, usually 5.2+).

## ESP-IDF Setup on Windows

1. Download the ESP-IDF Offline Installer for Windows from Espressif's website.
2. Run the installer and include ESP-IDF, Git, and Python (if not already installed).
3. Once installed, launch the **ESP-IDF Command Prompt** (available in the Start Menu).

## Building the Project

1. Open the ESP-IDF Command Prompt.
2. Navigate to the firmware directory:
   ```cmd
   cd C:\path\to\hermes-esp32-face\firmware\xiaozhi
   ```
3. Set the target board (e.g., esp32s3):
   ```cmd
   idf.py set-target esp32s3
   ```
4. Build the firmware:
   ```cmd
   idf.py build
   ```

## Common Windows Issues

- **Long Paths**: ESP-IDF can struggle with long Windows file paths. Keep the project close to the root of your drive (e.g., `C:\projects\hermes-esp32-face`).
- **Python Dependencies**: If you see Python errors, ensure you are running within the ESP-IDF environment, which isolates its Python packages.

## Finding the COM Port
1. Open Device Manager (Win + X -> Device Manager).
2. Look under "Ports (COM & LPT)".
3. Note the COM port of the USB Serial Device (e.g., `COM3`).

## Flashing

```cmd
idf.py -p COM3 flash
```
*(You can also use the helper script `scripts/flash.ps1`)*
