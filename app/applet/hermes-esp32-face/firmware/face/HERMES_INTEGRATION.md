# Face-for-Xiaozhi Integration

The files in this folder contain the custom LVGL display loops and FaceEngine graphics from `TechTalkies/Face-for-Xiaozhi`.

To finalize the integration with Hermes Desktop:
1. The `FaceEngine` code requires an LVGL display buffer (which `xiaozhi-esp32` initializes in `main/display/lvgl_display`).
2. We have intercepted the display state machine in `hermes_status_protocol.c`.
3. When `hermes_set_state()` is called, it triggers `face_set_animation_state(id)`, overriding the default XiaoZhi static logos with these dynamic face renderings.

This directory remains intact so Hermes Desktop engineers can easily modify the eye tracking and mouth animation shapes.
