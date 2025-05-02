import functools
import http.server
import os


class Server:
	def __init__(self, root, var_status, var_running, port):
		self.root = root
		self.var_status = var_status
		self.var_running = var_running
		self.port = port

	def run(self):
		try:
			self.var_running.set(True)
			handler = functools.partial(Handler, directory=os.path.dirname(__file__))
			httpd = http.server.HTTPServer(("localhost", self.port), handler, False)
			
			self.root.after(0, lambda : self.var_status.set("Starting server..."))
			httpd.server_bind()
			httpd.server_activate()
			self.root.after(0, lambda : self.var_status.set("Server is running."))
			with httpd:
				httpd.serve_forever()
		except Exception as e:
			ee = e
			self.root.after(0, lambda: self.var_status.set("Error: " + str(ee)))
		finally:
			self.var_running.set(False)

class Handler(http.server.SimpleHTTPRequestHandler):
	def list_directory(self, _dir):
		self.send_response(301)
		self.send_header('Location', '/nowplaying.html')
		self.end_headers()
		return ""