#include "hermes_status_protocol.h"
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "driver/uart.h"

static const char *TAG = "HERMES_PROTO";

// Mock reference to Face-for-Xiaozhi LVGL display update functions.
// In a full build, this hooks directly into the Face's state machine.
extern void face_set_animation_state(int state_id);
extern void face_set_text(const char* text);

void hermes_set_state(hermes_state_t state, const char* text) {
    ESP_LOGI(TAG, "Setting state: %d, Text: %s", state, text);
    
    // Fallback/Mock mapping for Face-for-Xiaozhi
    // 0 = Idle, 1 = Listening, 2 = Thinking, 3 = Speaking, 4 = Busy/Focus, 5 = Error, 6 = Sleep
    int face_state_id = 0; 
    
    switch (state) {
        case HERMES_STATE_IDLE:           face_state_id = 0; break;
        case HERMES_STATE_LISTENING:      face_state_id = 1; break;
        case HERMES_STATE_THINKING:       face_state_id = 2; break;
        case HERMES_STATE_SPEAKING:       face_state_id = 3; break;
        case HERMES_STATE_WORKER_BUSY:    face_state_id = 4; break;
        case HERMES_STATE_ERROR:          face_state_id = 5; break;
        case HERMES_STATE_EMERGENCY_STOP: face_state_id = 5; break; // Map to alert
        case HERMES_STATE_OFFLINE:        face_state_id = 6; break;
        default: face_state_id = 0; break;
    }

    // These calls assume the face code exposes these setters.
    extern void face_set_state_and_text(int state_id, const char* text);
    face_set_state_and_text(face_state_id, text);
}

void hermes_emit_button_event(const char* event_type) {
    printf("BUTTON=%s\n", event_type);
}

static void hermes_serial_task(void *arg) {
    uint8_t data[128];
    char rx_buffer[128];
    int rx_index = 0;

    printf("DEVICE=READY\n");
    hermes_set_state(HERMES_STATE_IDLE, "Hermes Ready");

    while (1) {
        int len = uart_read_bytes(UART_NUM_0, data, (sizeof(data) - 1), 20 / portTICK_PERIOD_MS);
        if (len > 0) {
            for (int i = 0; i < len; i++) {
                char c = (char)data[i];
                if (c == '\n' || c == '\r') {
                    if (rx_index > 0) {
                        rx_buffer[rx_index] = '\0';
                        
                        // Parse command: STATUS=<STATE>;TEXT=<String>
                        if (strncmp(rx_buffer, "STATUS=", 7) == 0) {
                            char state_str[32] = {0};
                            char text_str[64] = {0};
                            
                            // Naive parse for demo purposes
                            char* text_ptr = strstr(rx_buffer, ";TEXT=");
                            if (text_ptr) {
                                int state_len = text_ptr - (rx_buffer + 7);
                                if (state_len < sizeof(state_str)) {
                                    strncpy(state_str, rx_buffer + 7, state_len);
                                }
                                strncpy(text_str, text_ptr + 6, sizeof(text_str) - 1);
                                
                                hermes_state_t new_state = HERMES_STATE_IDLE;
                                if (strcmp(state_str, "LISTENING") == 0) new_state = HERMES_STATE_LISTENING;
                                else if (strcmp(state_str, "THINKING") == 0) new_state = HERMES_STATE_THINKING;
                                else if (strcmp(state_str, "SPEAKING") == 0) new_state = HERMES_STATE_SPEAKING;
                                else if (strcmp(state_str, "WORKER_BUSY") == 0) new_state = HERMES_STATE_WORKER_BUSY;
                                else if (strcmp(state_str, "ERROR") == 0) new_state = HERMES_STATE_ERROR;
                                else if (strcmp(state_str, "EMERGENCY_STOP") == 0) new_state = HERMES_STATE_EMERGENCY_STOP;
                                else if (strcmp(state_str, "OFFLINE") == 0) new_state = HERMES_STATE_OFFLINE;
                                
                                hermes_set_state(new_state, text_str);
                            }
                        }
                        rx_index = 0;
                    }
                } else {
                    if (rx_index < sizeof(rx_buffer) - 1) {
                        rx_buffer[rx_index++] = c;
                    }
                }
            }
        }
    }
}

void hermes_status_protocol_init(void) {
    ESP_LOGI(TAG, "Initializing Hermes Status Protocol Task");
    // UART0 is already configured by ESP-IDF console, we just read from it.
    xTaskCreate(hermes_serial_task, "hermes_serial", 4096, NULL, 5, NULL);
}
