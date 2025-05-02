import functools
import http.server
import os


def run_server(port):
	handler = functools.partial(Handler, directory=os.path.dirname(__file__))
	httpd = http.server.HTTPServer(("localhost", port), handler, False)
	print("Binding to port",port,"...")
	httpd.server_bind()
	httpd.server_activate()
	print("Server activated.")
	with httpd:
		httpd.serve_forever()

class Handler(http.server.SimpleHTTPRequestHandler):
	def list_directory(self, _dir):
		self.send_response(301)
		self.send_header('Location', '/nowplaying.html')
		self.end_headers()
		return ""