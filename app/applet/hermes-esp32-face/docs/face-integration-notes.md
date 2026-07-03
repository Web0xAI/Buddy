# Face Integration Notes

## How Face-for-Xiaozhi Was Integrated
The UI/Display logic from `Face-for-Xiaozhi` was copied into the ESP32 project. Originally, `xiaozhi-esp32` uses a custom UI framework (LVGL or native drawing) to display states (Wi-Fi connecting, speaking, etc.). 

We replaced the default static state icons with the animated eyes/face structures from `Face-for-Xiaozhi`.

## Modified Display Functions
The main display task in `firmware/xiaozhi/main/display` (or equivalent UI controller) was modified to:
1. Initialize the Face structure instead of the default boot logo.
2. Accept a state Enum (`HERMES_STATE_...`) and trigger the corresponding face transition.

## Supported States
The following states are supported and mapped to face animations:
- `IDLE`: Face is idle/blinking. Text: "Hermes Ready"
- `LISTENING`: Face looks attentive. Text: "Listening"
- `THINKING`: Face neutral/processing. Text: "Thinking"
- `SPEAKING`: Face mouth animation running. Text: "Speaking"
- `WORKER_BUSY`: Face focused. Text: "Worker Busy"
- `ERROR`: Face alert/sad. Text: "Check Logs"
- `EMERGENCY_STOP`: Face warning. Text: "Stopped"
- `OFFLINE`: Face sleeping. Text: "Offline"
