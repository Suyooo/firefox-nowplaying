#!/usr/bin/env python3
import json
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
	try:
		receivedMessage = receive()
		with open("songtitle.txt", "a") as outfile:
			outfile.write(str(receivedMessage))
			outfile.write("\n")
		send("1")
	except Exception as e:
		msg = str(e)
		with open("error.txt", "w") as outfile:
			outfile.write(msg)
		send(msg)
