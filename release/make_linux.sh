#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

if ldd --version | grep -i GLIBC; then
	LIBC="glibc"
else
	LIBC="musl"
fi
ARCH=$(uname -m)
FILE=nowplaying-linux-$LIBC-$ARCH

nuitka ../native/__main__.py --onefile \
	--include-module=receiver --include-module=ui \
	--include-data-file=../native/native-base.json=native-base.json \
	--include-data-file=../native/nowplaying-template.html=nowplaying-template.html \
	--output-filename=$FILE
mkdir -p dist && mv $FILE dist