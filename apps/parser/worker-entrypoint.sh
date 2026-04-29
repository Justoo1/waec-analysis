#!/bin/sh
# Runs before Celery starts. Cleans up any temp files left by a previous
# OOM-killed worker so they don't accumulate on the shared volume.
UPLOAD_DIR="${UPLOAD_TMP_DIR:-/tmp}"
echo "[entrypoint] Cleaning orphaned upload files in ${UPLOAD_DIR}..."
find "${UPLOAD_DIR}" -maxdepth 1 \( -name "tmp*.pdf" -o -name "tmp*.xlsx" \) -delete
echo "[entrypoint] Done. Starting Celery worker..."
exec "$@"
