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

mkdir -p dist
nuitka ../native/__main__.py --onefile \
	--include-module=receiver --include-module=server --include-module=ui \
	--include-data-file=../native/native-base.json=native-base.json \
	--output-filename=dist/$FILE