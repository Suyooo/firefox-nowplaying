#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

mkdir -p dist
rm -rf .pyzw-build && mkdir .pyzw-build
cd ../native
zip ../release/.pyzw-build/nowplaying.zip *.py native-base.json nowplaying-template.html version
cd -
echo "#!/usr/bin/env python3" > .pyzw-build/header
cat .pyzw-build/header .pyzw-build/nowplaying.zip > dist/nowplaying.pyzw
chmod +x dist/nowplaying.pyzw
rm -rf .pyzw-build