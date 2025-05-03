# firefox-nowplaying

Grab the current title of videos or audios playing from a set of sites and put it in a text file on your PC.

Made primarily for streaming, so you can have a "Now Playing" overlay if you use your browser to play music.

## Currently Supported Sites

- YouTube
- Spotify

## Installation

Install the extension from the Firefox Addon store. (There'll be a link here once it's approved.)

You also need to install a native application on your PC to allow the addon to store the file on your disk. Once you
have it installed, you can use the configuration tool to connect or disconnect the application from Firefox and change
the text format.

#### Via bundled executable (for x86 Linux and Windows)

1. Head to the release page and download the latest executable for your OS
1. Create a new folder in your favourite location and put the application in there
1. Launch the executable to open the configuration tool and hit the "Install" button

#### Via .pyzw (for MacOS or other architectures)

Instead of using the prepared releases, you can also directly run the scripts using a Python installed on your PC. This
is what you might need to do on MacOS - I don't own any Macs, so I have no way to create prebundled releases for them or
test it there.

1. Install Python 3 (on MacOS, try [Homebrew](https://brew.sh): `brew install python3`)
1. Install `tkinter` (check your OS package manager for `python3-tk` or similar, on MacOS: `brew install python-tk`)
1. Head to the release page and download the `.pyzw` release
1. Create a new folder in your favourite location and put the application in there
1. Launch the `.pyzw` file to open the configuration tool and hit the "Install" button

## Usage

Once you have installed the extension and connected the application, you can now click the extension icon in Firefox to
start. The extension will be tracking the tab you activate it in - you can visit the same site in other tabs without
affecting your Now Playing display.

It will keep automatically updating the current song title until you click the extension icon again, close the tab,
refresh or leave the page. If it works, you should see two new files, `nowplaying.txt` and `nowplaying.html`, created in
the same folder as the application.

You have two ways of using this extension with OBS:

### Text File

When creating a Text source in OBS, you can choose to load text from a text file. Point it at the `nowplaying.txt` file
created in the desktop application's folder, then style the Text source as usual, and you have an auto-updating song
title for your stream!

### Browser Source

If you'd like to be more flexible with styling, you can use a Browser source to display the `nowplaying.html` file.
Create a Browser source in OBS, check "Local File", and choose the HTML file in the application's folder.

You can now use the "Custom CSS" option of the Browser source to fully style the overlay as you want, by writing CSS
rules for the `#nowplaying`, `#title` and `#artist` selectors. Here's some examples:
