# Board Selection

## Recommended First Target
**ESP32-S3**

The upstream `xiaozhi-esp32` project heavily focuses on the ESP32-S3 and ESP32-P4. For Hermes Desktop, the ESP32-S3 is the most accessible, widely available, and best-supported target that handles display rendering and audio I2S pipelines flawlessly.

## Hardware Requirements
When buying or selecting a board, ensure it has:
1. **ESP32-S3** microcontroller (ideally with PSRAM).
2. **Display**: SPI or I2C display (LCD/OLED). The upstream project supports various drivers (like GC9A01 for round displays, commonly used for the face).
3. **Audio**: I2S Microphone (e.g., INMP441) and I2S DAC/Amp (e.g., MAX98357A) connected.
4. **USB**: Native USB or UART bridge (CH340/CP2102) for serial communication and flashing.
5. **Button**: At least one GPIO tied to a push button for physical interaction.

## Common Development Boards
- **ESP32-S3-LCD-EV-Board**
- Custom boards designed for the XiaoZhi project.
- General purpose ESP32-S3 boards with external displays and audio breakouts wired according to the `xiaozhi-esp32` pin configurations (check `firmware/xiaozhi/main/boards` or `Kconfig` for pinouts).
