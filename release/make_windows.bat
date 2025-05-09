cd /D "%~dp0"

set "_ARCH_=unknown"
reg query "HKLM\Software\Microsoft\Windows NT\CurrentVersion" /v "BuildLabEx" | >nul find /i ".x86fre."   && set "_ARCH_=x86" 
reg query "HKLM\Software\Microsoft\Windows NT\CurrentVersion" /v "BuildLabEx" | >nul find /i ".amd64fre." && set "_ARCH_=x86_64" 
reg query "HKLM\Software\Microsoft\Windows NT\CurrentVersion" /v "BuildLabEx" | >nul find /i ".armfre."   && set "_ARCH_=arm" 
set "_FILE_=nowplaying-windows-%_ARCH_%.exe"

py -m nuitka ../native/__main__.py --msvc=latest --onefile --enable-plugin=tk-inter ^
	--include-module=receiver --include-module=ui ^
	--include-data-file=../native/native-base.json=ui/native-base.json ^
	--include-data-file=../native/nowplaying-template.html=receiver/nowplaying-template.html ^
	"--product-name=Now Playing" --file-version=1.3.0 --file-description=https://github.com/Suyooo/firefox-nowplaying ^
	--windows-console-mode=attach --windows-icon-from-ico=../addon/icon-notification.png ^
	--output-filename=%_FILE_%
if not exist dist mkdir dist
move %_FILE_% dist