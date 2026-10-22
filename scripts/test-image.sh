#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
image="${1:-magane-server:security-test}"

# Database and pack writes exist only in this disposable container.
docker run --rm --network none \
  --tmpfs /app/database:uid=1000,gid=1000,mode=0700 \
  --tmpfs /app/packs:uid=1000,gid=1000,mode=0700 \
  --mount "type=bind,source=${project_dir}/tests,target=/app/tests,readonly" \
  --env MAGANE_IMAGE_TEST=1 \
  --env secret=image-test-secret \
  --env baseURL=https://example.test/packs/ \
  --entrypoint bun \
  "$image" test tests/image.test.ts --timeout 15000
