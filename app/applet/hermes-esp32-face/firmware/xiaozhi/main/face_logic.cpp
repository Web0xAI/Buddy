#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "FACE_LOGIC";

// Representing the face animation state request
typedef struct {
    int state_id;
    char text[64];
} face_update_msg_t;

static QueueHandle_t face_msg_queue = NULL;

// Active state tracking
static int current_face_state = 0;
static char current_face_text[64] = "Hermes Ready";

// State Dispatcher - processes incoming states and triggers animations
static void face_dispatcher_task(void *arg) {
    face_update_msg_t incoming_msg;

    while (1) {
        // Block until a new state message arrives
        if (xQueueReceive(face_msg_queue, &incoming_msg, portMAX_DELAY) == pdPASS) {
            ESP_LOGI(TAG, "Dispatcher received new state: %d, Text: %s", 
                     incoming_msg.state_id, incoming_msg.text);
            
            // Update active state
            if (incoming_msg.state_id >= 0) {
                current_face_state = incoming_msg.state_id;
            }
            if (strlen(incoming_msg.text) > 0) {
                strncpy(current_face_text, incoming_msg.text, sizeof(current_face_text) - 1);
            }
            
            // Trigger animation transition in FaceEngine
            // Example: FaceEngine::getInstance().transitionTo(current_face_state, current_face_text);
        }
    }
}

// Rendering Routine - decoupled from state parsing, runs at target FPS
static void face_render_task(void *arg) {
    while (1) {
        // Render cycle: continually update the display based on current state
        // Example: FaceEngine::getInstance().renderFrame(current_face_state);
        // lv_timer_handler(); // If LVGL is used
        
        // Yield to maintain ~60fps
        vTaskDelay(pdMS_TO_TICKS(16)); 
    }
}

extern "C" void face_logic_init(void) {
    ESP_LOGI(TAG, "Initializing state-driven face logic");
    
    // Create a queue to decouple serial parser from rendering
    face_msg_queue = xQueueCreate(10, sizeof(face_update_msg_t));
    if (face_msg_queue == NULL) {
        ESP_LOGE(TAG, "Failed to create face message queue");
        return;
    }

    // Start the state dispatcher task (handles state transitions)
    xTaskCreatePinnedToCore(face_dispatcher_task, "face_dispatcher", 4096, NULL, 5, NULL, 1);
    
    // Start the asynchronous render task (handles display updates)
    xTaskCreatePinnedToCore(face_render_task, "face_render", 4096, NULL, 4, NULL, 1);
}

// External C hooks for hermes_status_protocol.c
extern "C" void face_set_animation_state(int state_id) {
    if (face_msg_queue == NULL) return;
    
    face_update_msg_t msg;
    msg.state_id = state_id;
    msg.text[0] = '\0'; // We'll rely on face_set_text or a unified call
    
    // Non-blocking send
    xQueueSend(face_msg_queue, &msg, 0);
}

extern "C" void face_set_state_and_text(int state_id, const char* text) {
    if (face_msg_queue == NULL) return;
    
    face_update_msg_t msg;
    msg.state_id = state_id;
    if (text != NULL) {
        strncpy(msg.text, text, sizeof(msg.text) - 1);
        msg.text[sizeof(msg.text) - 1] = '\0';
    } else {
        msg.text[0] = '\0';
    }
    
    // Overwrite the queue if full or just send
    xQueueSend(face_msg_queue, &msg, 0);
}

extern "C" void face_set_text(const char* text) {
    // Legacy support for separated calls if needed, though unified is better.
    // In this decoupled design, we'd prefer sending them together.
}
