# Buddy Avatar State Map v7

## Runtime modes

```text
normal_mode = human-facing Buddy
chucky_mode = GibberTalk transmission Buddy
```

## Normal flow

```text
app_loaded
  -> normal_mode.greeting
  -> normal_mode.idle

mic_active / user_speaking
  -> normal_mode.listening

assistant_processing
  -> normal_mode.thinking

assistant_speaking
  -> normal_mode.speaking

assistant_done
  -> normal_mode.idle

mic_permission_denied / network_error
  -> normal_mode.concerned
```

## GibberTalk / Chucky Mode flow

```text
gibbertalk_started
  -> chucky_mode.entry_transform

gibbertalk_channel_open
  -> chucky_mode.transmission_idle

gibbertalk_sending
  -> chucky_mode.transmitting_send

gibbertalk_receiving
  -> chucky_mode.transmitting_receive

gibbertalk_audio_burst
  -> chucky_mode.coded_talking

gibbertalk_peak
  -> chucky_mode.transmission_peak

gibbertalk_error
  -> chucky_mode.transmission_error

gibbertalk_ended
  -> chucky_mode.recovery
  -> normal_mode.idle

human_interrupt
  -> chucky_mode.recovery
  -> normal_mode.listening
```

## Key rule

Chucky Mode is not just a face.  
Chucky Mode is the persistent visual wrapper for GibberTalk transmission.
