#!/usr/bin/env python3
import json
import os
import sys

from ui import handle as ui_handle
from receiver import handle as receiver_handle


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

	if len(sys.argv) == 1:
		# Config UI
		ui_handle(config)
	else:
		# Receiving data from Firefox
		receiver_handle(config)
