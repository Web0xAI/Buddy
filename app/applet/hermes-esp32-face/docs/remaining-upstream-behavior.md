# Remaining Upstream Behavior

While we have disconnected the XiaoZhi cloud dependencies from the default boot path, some upstream behaviors remain dormant in the codebase:

1. **Wi-Fi Provisioning (SmartConfig / BLE)**: The code for provisioning Wi-Fi using the XiaoZhi mobile app is still present but bypassed during our boot sequence.
2. **Audio Cloud Streams**: The I2S audio drivers and buffers are intact. The HTTP/WebSocket clients that normally connect to the XiaoZhi servers are disabled in `hermes_status_protocol`, but the C source files remain in the build tree.
3. **OTA Updates**: The upstream Over-The-Air (OTA) update logic is still in the code. It currently attempts to poll a hardcoded server if Wi-Fi connects, but will safely fail. This should be re-mapped to a local Hermes Desktop endpoint later.
4. **Uncustomized Screens**: Some deep menu screens (if any exist in the base UI) have not been replaced with the Face animations and may still show default XiaoZhi graphics.
