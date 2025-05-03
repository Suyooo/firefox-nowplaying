#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

cd ../addon
zip ../release/dist/nowplaying-firefox.zip *