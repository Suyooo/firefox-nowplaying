# firefox-nowplaying

Grab the current title of videos or audios playing from a set of sites and put it in a text file on your PC.

Made primarily for streaming, so you can have a "Now Playing" overlay if you use your browser to play music.

## Currently Supported Sites

- YouTube
- Spotify

## Installation

Install the extension from the Firefox Addon store. (There'll be a link here once it's approved.)

You also need to install a native application on your PC to allow the addon to store the file on your disk. Once you
have it installed, you can use the configuration tool to change the text format and file location. Make sure to hit the
"Install" button in the config tool to connect the application to Firefox!

#### Linux or Windows

1. Download the latest release and extract it in your favourite folder
1. Run `nowplaying`/`nowplaying.exe` to open the configuration tool and hit the "Install" button

#### Run directly (for MacOS or other architectures)

Instead of using the prepared releases, you can also directly run the scripts from this repository using a Python
installed on your PC. This is what you might need to do on MacOS - I don't own any Macs, so I have no way to create
prebundled releases for them or test it there. The Linux version might work if you have a Mac without an M-series chip
(let me know if you try!), otherwise:

1. Install Python 3 (on MacOS, try [Homebrew](https://brew.sh): `brew install python3`)
1. Install requirements: `pip install tk`
1. Download this repository to your favourite location
1. Run `./native/main.py` to open the configuration tool and hit the "Install" button

## Usage

Once you have installed the extension and connected the application, you can now click the extension icon in Firefox to
start. The extension will be tracking the tab you activate it in - you can visit the same site in other tabs without
affecting your Now Playing display. It will keep automatically updating the current song title until you close or
refresh the tab.

You have two ways of using this extension with OBS:

### Text File

When creating a Text source in OBS, you can choose to load text from a text file. Point it at the `nowplaying.txt` file
created in the desktop application's folder, then style the Text source as usual, and you have an auto-updating song
title for your stream!

The advantage for this is that after setting up the desktop application, you don't need to worry about the configuration
anymore. Whenever you activate the extension from now on, it'll start updating OBS right away. However, you are limited
to the styling options the Text source gives you.

### Browser Source

If you'd like to be more flexible with styling, you can use the desktop application to serve up a page to use with a
browser source. Open the configuration like before, then click "Start Server". If you get any firewall warnings, make
sure to allow the server.

Create a Browser source in OBS, and use the URL shown in the configuration tool. It's important to keep the window open! (Minimizing is fine, just don't close the configuration tool while you are streaming.) If successful, you should now be
able to see your (unstyled) song title on your stream preview.

You'll have to remember to start the configuration tool every time before you stream, the extension does not work by
itself as it does with the Text source approach. However, you can use the "Custom CSS" option of the Browser source to
fully style the overlay as you want, by writing CSS rules for the `#nowplaying` selector (also `#title` and `#artist` if
you enable the "Wrap output in HTML" setting). Here's some examples:
