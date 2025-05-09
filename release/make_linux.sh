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
VERSION=$(cat ../native/version)

nuitka ../native/__main__.py --onefile --enable-plugin=tk-inter \
	--include-module=receiver --include-module=ui \
	--include-data-file=../native/version=ui/version \
	--include-data-file=../native/native-base.json=ui/native-base.json \
	--include-data-file=../native/nowplaying-template.html=receiver/nowplaying-template.html \
	"--product-name=Now Playing" --file-version=$VERSION --file-description=https://github.com/Suyooo/firefox-nowplaying \
	--linux-icon=../addon/icon-notification.png  --output-filename=$FILE
mkdir -p dist && mv $FILE dist