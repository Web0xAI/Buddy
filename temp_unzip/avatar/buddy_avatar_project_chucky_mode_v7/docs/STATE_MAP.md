# Buddy Avatar State Map

```text
NORMAL HUMAN-FACING FLOW

app_loaded
  -> normal.greeting
  -> normal.idle

mic_active / user_speaking
  -> normal.listening

user_finished / assistant_processing
  -> normal.thinking

assistant_speaking
  -> normal.talking

assistant_done
  -> normal.idle

mic_permission_denied / network_error
  -> normal.concerned
```

```text
GIBBERTALK / CHUCKY MODE FLOW

gibbertalk_started
  -> chucky.entry
  -> chucky.transmission

gibbertalk_sending
  -> chucky.talking

gibbertalk_receiving
  -> chucky.evil_neutral

gibbertalk_peak
  -> chucky.wicked_grin

human_interrupt
  -> chucky.recovery
  -> normal.listening

gibbertalk_ended
  -> chucky.recovery
  -> normal.idle
```
