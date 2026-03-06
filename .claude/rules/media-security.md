---
paths:
- 'src/media/**'
- 'src/media-understanding/**'
- 'src/link-understanding/**'
---

# Media Pipeline Security

## Hard Rules

- **ALWAYS** validate MIME types from actual file content, not just the declared type — reject spoofed payloads
- **NEVER** trust user-supplied MIME types or file extensions without verification
- **ALWAYS** use `sharp` for image processing (already a dependency)
- **ALWAYS** respect channel-specific `mediaMaxMb` limits for outbound uploads
- **NEVER** commit or publish real media files (photos, videos) — use obviously fake placeholders in tests

## Recent Security Context

Media input validation was hardened in commit `084dfd2` (reject spoofed `input_image` MIME payloads). Any changes to media input handling must maintain this validation.
