# firefox-nowplaying

Grab the current title of video or music playing in your Firefox and put it in a text file on your PC.

Made primarily for streaming, so you can have a "Now Playing" overlay if you use your browser to play music.

![Example screenshot of two stream overlays that can be created in OBS using this extension](example.png?raw=true)

Any sites that use MediaMetadata will work with this extension. This includes, for example, YouTube, Spotify and
Soundcloud.

## Installation

Install the extension from the Firefox Addon store:
[Now Playing](https://addons.mozilla.org/en-GB/firefox/addon/now-playing/)

You also need to download the native application on your PC to allow the addon to store the file on your disk. It comes
with a configuration tool you can use to connect or disconnect the application from Firefox and change the look.

### Linux and Windows

1. Head to [the release page](https://github.com/Suyooo/firefox-nowplaying/releases) and download the latest executable
   for your OS
1. Create a new folder in your favourite location and put the application in there
1. Launch the executable to open the configuration tool and hit the "Connect" button

### MacOS or other architectures

Instead of using the prepared releases, you can also directly run the application using a Python installation on your
PC. This is what you probably need to do on MacOS - I don't own any Macs, so I have no way to create prebundled releases
for them or test it there. If you're giving it a try on MacOS, let me know whether it works or what you had to do!

1. Install Python 3 (on MacOS, try [Homebrew](https://brew.sh): `brew install python3`)
1. Install `tkinter` (check your OS package manager for `python3-tk` or similar, on MacOS: `brew install python-tk`)
1. Head to [the release page](https://github.com/Suyooo/firefox-nowplaying/releases) and download the `.pyzw` release
1. Create a new folder in your favourite location and put the application in there
1. Launch the `.pyzw` file to open the configuration tool and hit the "Connect" button

### Updating

The extension will update automatically if you installed it from the Firefox Addon store. It will notify you if a new
major update for the native application is required.

To update the native application, simply download the newest release and replace the previous file. As long as the
folder and filename stay the same, you don't even have to click "Connect" again (but it doesn't hurt to click it, if you
want to make sure everything is set up properly).

## Usage

Once you have installed the extension and connected the application, you can now click the extension icon in Firefox to
start. The extension will be tracking the tab you activate it in - you can visit the same site in other tabs without
affecting your Now Playing display.

While active, the extension icon will have a badge added. If the badge is red, it means you are currently on the tab
that is being tracked. The addon will keep automatically updating the current song title until you click the extension
icon again, close the tab, refresh or leave the page. If the badge is white instead of red, that means the extension is
active in another tab - click the icon to go to the tracked tab.

Try playing a song or video - if it everything is set up correctly, you should see two new files, `nowplaying.txt` and
`nowplaying.html`, created in the same folder as the application. If nothing happens, the site you use might not support
MediaMetadata, so try one of the sites mentioned above to test.

From now on, all you need to do to start using your Now Playing overlay is click the extension icon - no need to start
an application in the background or update the configuration, just the browser is enough!

You have two ways of using this extension with OBS:

### Text File

When creating a Text source in OBS, you can choose to load text from a text file. Point it at the `nowplaying.txt` file
created in the application's folder, then style the Text source as usual, and you have an auto-updating song title for
your stream!

### Browser Source

If you'd like to be more flexible with styling, you can use a Browser source to display the `nowplaying.html` file.
Create a Browser source in OBS, check "Local File", and choose the HTML file in the application's folder.

You can now use the CSS field in the configuration tool to fully style the overlay however you want, by writing CSS
rules for the `#nowplaying` selector to style the container around all of the text, the `#title`, `#artist` and `#album`
selectors to style just those values, and the `#artwork` selector to position the cover art. Note that the HTML file
won't update until the song changes while the Firefox extension is active!

Be warned that the "Custom CSS" option in the OBS Browser source settings might lead to flickering, since that CSS block
is loaded with a slight delay after each refresh. But you can still use it for just trying out styles, and then simply
copy it into the configuration tool to properly set the CSS up.

Here's the CSS used for the example screenshots at the top, to give you a start:

```css
/* Text Format: 🎜 {$title$}{$if_artist$ - $}{$artist$} */

#nowplaying {
	background: rgba(0, 0, 0, 0.5);
	color: white;
	font-family: sans-serif;
	font-weight: semibold;
	font-size: 24px;
	padding: 0.25em 0.5em;
}
```

```css
/* Text Format: <div id="my_container">{$title$}{$artist$}</div>{$artwork$} */

/* This is the main container */
#nowplaying {
	/* This is a flexbox - place items horizontally */
	display: flex;
	gap: 5px;
	width: 350px;
	/* Using a fancy gradient as the background - https://cssgradient.io/ */
	background: linear-gradient(0deg, rgba(255, 204, 255, 1) 0%, rgba(204, 255, 255, 1) 50%, rgba(255, 255, 255, 1) 100%);
	/* Add a border, round the corners, and add some space between items and the border */
	border: 2px white solid;
	border-radius: 20px;
	padding: 5px;
	/* Choose a nice font */
	font-family: Quicksand;
}

/* We can add extra text using the ::before and ::after pseudo-elements */
#nowplaying::before {
	content: "NOW PLAYING";
	/* Place this at fixed coordinates */
	position: absolute;
	top: 5px;
	left: 10px;
	/* Text style */
	color: #770077;
	font-size: 10px;
	letter-spacing: 3px;
}

/* This is a custom container we defined in the text format */
#my_container {
	/* This is a vertical flexbox */
	display: flex;
	flex-direction: column;
	/* Center content along the main axis */
	justify-content: center;
	/* Make this as big as possible in the parent's flexbox */
	flex-grow: 1;
	/* Cut off text if it is too long */
	overflow: hidden;
	/* Add some space on just the left side */
	padding-left: 15px;
}

#title {
	color: #003333;
	font-weight: bold;
	font-size: 20px;
	/* Do not break lines - if the title is too long, cut it of with triple dots */
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

#artist {
	color: #007777;
	font-size: 14px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

#artwork {
	/* Fixed height, rounded corners */
	height: 64px;
	border-radius: 12px;
	/* Make this element always a square, even if the image is a different aspect ratio */
	aspect-ratio: 1;
	/* If the image is not square, cut off the sides so the square is fully filled */
	/* If you prefer letterboxing/pillarboxing, try object-fit: contain; */
	object-fit: cover;
}
```
