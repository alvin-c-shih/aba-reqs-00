# 0016 — Photos and video require recorded consent and stay on local disk

**Status:** Accepted · 2026-11-11

## Decision
- Consent is recorded **per student and per kind** (photo, video) by the BCBA, with who gave it, where the signed form is kept and the date. Recording a new consent supersedes the old; revoking is a timestamp.
- **Uploads are refused by the server** unless a current consent of that kind exists. The check is in the API, not the screen.
- Files are sent as a raw request body (no multipart parser dependency), limited to 25 MB and to JPEG/PNG/WebP/MP4/WebM/MOV. The server chooses the file name; nothing from the client reaches the path.
- Stored under `data/media/<env>/<school>/` (git-ignored), **never served statically**: every view goes through an endpoint that applies the student scope, sets `no-store`, and writes an audit row.
- RBTs and BCBAs can add and view; only a BCBA can remove (soft delete). Parents and teachers cannot see media.
- On the phone the recorder offers "Add a photo" (opens the camera) when online.

## Not built
In-app video recording, offline queueing of media, thumbnails, encryption of files at rest (a deployment concern, like the database disk), retention rules.

## Revisit when
Media needs to work offline, or storage moves off the application host.
