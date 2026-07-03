const fs = require('fs');
let file = fs.readFileSync('hermes-esp32-face/firmware/xiaozhi/main/CMakeLists.txt', 'utf8');
file = file.replace('set(SOURCES "audio/audio_codec.cc"', 'set(SOURCES "audio/audio_codec.cc"\n            "hermes_status_protocol.c"');
fs.writeFileSync('hermes-esp32-face/firmware/xiaozhi/main/CMakeLists.txt', file);
