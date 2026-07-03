#pragma once

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    HERMES_STATE_IDLE,
    HERMES_STATE_LISTENING,
    HERMES_STATE_THINKING,
    HERMES_STATE_SPEAKING,
    HERMES_STATE_WORKER_BUSY,
    HERMES_STATE_ERROR,
    HERMES_STATE_EMERGENCY_STOP,
    HERMES_STATE_OFFLINE
} hermes_state_t;

/**
 * @brief Initialize the Hermes USB Serial protocol listener.
 * This sets up a background task to read from UART0 (USB Serial) and
 * parse incoming Hermes commands.
 */
void hermes_status_protocol_init(void);

/**
 * @brief Emit a button event to the USB Serial port for Hermes Desktop.
 * @param event_type String representing the event (e.g., "SHORT_PRESS")
 */
void hermes_emit_button_event(const char* event_type);

/**
 * @brief Trigger a state change and update the face display.
 * @param state The target state
 * @param text The text to display below the face
 */
void hermes_set_state(hermes_state_t state, const char* text);

#ifdef __cplusplus
}
#endif
