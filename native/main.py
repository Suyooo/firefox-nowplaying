#!/usr/bin/env python3
import json
import os
import sys

from ui import handle as ui_handle
from receiver import handle as receiver_handle


if __name__ == '__main__':
	config = {
		"format": "{$title$}{$if_artist$ - $}{$artist$}",
		"server_port": 8944,
	}
	if os.path.isfile(os.path.join(os.path.dirname(__file__), "settings.json")):
		with open(os.path.join(os.path.dirname(__file__), "settings.json"), "r") as configfile:
			try:
				config = config | json.load(configfile)
			except Exception:
				pass

	if len(sys.argv) == 1:
		# Config UI
		ui_handle(config)
	else:
		# Receiving data from Firefox
		receiver_handle(config)
