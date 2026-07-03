# Buddy + GibberTalk + Chucky Mode Handoff Package

Generated: 2026-07-02T09:59:57

This package is meant to be uploaded to AI Studio or given to an app-building agent as a single handoff bundle.

## Contents

```text
source_projects/
  buddy_project_latest.zip
  buddy_project_alt_upload.zip
  gibbertalk_project.zip

avatar_assets/
  buddy_avatar_project_chucky_mode_v7.zip

reference_pngs/
  buddy_reference_pngs_v7.zip

prompts/
  AI_STUDIO_MASTER_PROMPT.md

docs/
  MERGE_PLAN.md

contracts/
  implementation_contract.json
```

## Main instruction

Do not start with UI cleanup.

Use the Buddy project as the base app.  
Use GibberTalk as a hidden protocol module.  
Use Chucky Mode as the visual state for active GibberTalk transmission.

## Recommended usage

1. Upload this entire package.
2. Paste `prompts/AI_STUDIO_MASTER_PROMPT.md` into AI Studio.
3. Tell AI Studio to inspect all included zips before editing.
4. Confirm the app still builds after each phase.

## Included files

{
  "source_projects/buddy_project_latest.zip": {
    "source_path": "/mnt/data/remix_-buddy.zip",
    "size_bytes": 4011674
  },
  "source_projects/buddy_project_alt_upload.zip": {
    "source_path": "/mnt/data/remix_-buddy (1).zip",
    "size_bytes": 4011674
  },
  "source_projects/gibbertalk_project.zip": {
    "source_path": "/mnt/data/gibberlink-terminal.zip",
    "size_bytes": 450625
  },
  "avatar_assets/buddy_avatar_project_chucky_mode_v7.zip": {
    "source_path": "/mnt/data/buddy_avatar_project_chucky_mode_v7.zip",
    "size_bytes": 3728837
  },
  "reference_pngs/buddy_reference_pngs_v7.zip": {
    "source_path": "/mnt/data/buddy_reference_pngs_v7.zip",
    "size_bytes": 3412199
  }
}

## Missing files

{}
