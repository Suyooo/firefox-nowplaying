#!/usr/bin/env python3
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


if __name__ == '__main__':
	if os.path.isfile("settings.json"):
		with open("settings.json", "r") as configfile:
			config = json.load(configfile)
	else:
		config = {
			"file_path": "songtitle.txt",
			"wrap_html": False,
			"format": "{$title$}{$if_artist$ - $}{$artist$}",
		}

	if len(sys.argv) == 0:
		# Config UI
		pass
	else:
		# Receiving data from Firefox
		try:
			msg = receive()
			formatted = config["format"]
			formatted = formatted.replace("{$title$}", msg["title"])
			formatted = formatted.replace(
				"{$artist$}", msg["artist"] if "artist" in msg else "")
			formatted = re.sub(r"\{\$if_artist\$(.+?)\$\}",
                            r"\1" if "artist" in msg else "", formatted)

			with open(config["file_path"], "w") as outfile:
				outfile.write(formatted)
				outfile.write("\n")
			send("1")
		except Exception as e:
			msg = str(e)
			with open("error.txt", "w") as outfile:
				outfile.write(msg)
			send(msg)
