import html
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
		formatted = config["format"]
		if config["wrap_html"]:
			formatted = formatted.replace("{$title$}", "<span id='title'>" + html.escape(msg["title"]) + "</span>")
			formatted = formatted.replace(
					"{$artist$}",
					("<span id='artist'>" + html.escape(msg["artist"]) + "</span>") if "artist" in msg else ""
				)
		else:
			formatted = formatted.replace("{$title$}", msg["title"])
			formatted = formatted.replace("{$artist$}", msg["artist"] if "artist" in msg else "")
		formatted = re.sub(r"\{\$if_artist\$(.+?)\$\}", r"\1" if "artist" in msg else "", formatted)

		with open(os.path.join(os.path.dirname(__file__), "nowplaying.txt"), "w") as outfile:
			outfile.write(formatted)
			outfile.write("\n")
		send("1")
	except Exception as e:
		msg = str(e)
		with open("error.txt", "w") as outfile:
			outfile.write(msg)
		send(msg)
