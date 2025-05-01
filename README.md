# firefox-nowplaying

Grab the current title of videos or audios playing from a set of sites and put it in a text file on your PC.

Made primarily for streaming so you can have a "Now Playing" overlay if you use your browser to play music.

## Currently Supported Sites

- YouTube
- Spotify

## Installing

Install the extension from the Firefox Addon store. (There'll be a link here once it's approved.)

You also need to install a native application on your PC to allow the addon to store the file on your disk. Once you
have it installed, you can use the configuration tool to change the text format and file location. Make sure to hit the
"Install" button in the config tool to connect the application to Firefox!

#### Linux or Windows

1. Download the latest release and extract it in your favourite folder
1. Run `nowplaying`/`nowplaying.exe` to open the configuration tool

#### MacOS (and other architectures)

I don't own any Macs, so I have no way to create prebundled releases for them. It's also fully untested there. However,
you should still be able to run things manually.

1. Install Python 3 (on MacOS, try [Homebrew](https://brew.sh): `brew install python3`)
1. Install requirements: `pip install tk`
1. Download this repository
1. Run `./native/main.py` to open the configuration tool and hit the "Install" button
1. Afterwards, manually go the installed JSON file, and add `.py` to the end of the `path` property

## Usage

Once you have installed the extension and connected the application, you can now click the extension icon in Firefox to
start.
