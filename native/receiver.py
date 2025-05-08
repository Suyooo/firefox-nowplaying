import html
import importlib
import json
import os
import re
import sys


def receive():
	length = int.from_bytes(sys.stdin.buffer.read(4), 'little')
	msg = sys.stdin.buffer.read(length).decode('utf-8')
	return json.loads(msg)


def send(msg):
	msg = json.dumps(msg).encode('utf-8')
	sys.stdout.buffer.write(len(msg).to_bytes(4, 'little'))
	sys.stdout.buffer.write(msg)


def handle(config):
	try:
		msg = receive()
		formatted = html.escape(config["format"])

		formatted = re.sub(r"\{\$if_artist\$(.+?)\$\}", r"\1" if "artist" in msg else "", formatted)
		formatted = re.sub(r"\{\$if_album\$(.+?)\$\}", r"\1" if "album" in msg else "", formatted)

		raw_formatted = formatted.replace("{$title$}", msg["title"] if "title" in msg else "")
		raw_formatted = raw_formatted.replace("{$artist$}", msg["artist"] if "artist" in msg else "")
		raw_formatted = raw_formatted.replace("{$album$}", msg["album"] if "album" in msg else "")
		raw_formatted = raw_formatted.replace("{$artwork$}", msg["artwork"] if "artwork" in msg else "")

		html_formatted = formatted.replace(
				"{$title$}",
				('<span id="title">' + html.escape(msg["title"]) + "</span>") if "title" in msg else ""
			)
		html_formatted = html_formatted.replace(
				"{$artist$}",
				('<span id="artist">' + html.escape(msg["artist"]) + "</span>") if "artist" in msg else ""
			)
		html_formatted = html_formatted.replace(
				"{$album$}",
				('<span id="album">' + html.escape(msg["album"]) + "</span>") if "album" in msg else ""
			)
		html_formatted = html_formatted.replace(
				"{$artwork$}",
				('<img id="artwork" src="' + html.escape(msg["artwork"]) + '" />') if "artwork" in msg else ""
			)

		with open(os.path.join(os.path.dirname(sys.argv[0]), "nowplaying.txt"), "w") as outfile:
			outfile.write(raw_formatted)
		with importlib.resources.open_text(__name__, "nowplaying-template.html") as templfile:
			with open(os.path.join(os.path.dirname(sys.argv[0]), "nowplaying.html"), "w") as outfile:
				outfile.write(templfile.read().replace("$FORMAT$", html_formatted).replace("$CSS$", config["css"]))
		send("1")
	except Exception as e:
		msg = str(e)
		with open(os.path.join(os.path.dirname(sys.argv[0]), "error.txt"), "w") as outfile:
			outfile.write(msg)
		send(msg)
