import json
import os
import pathlib
import sys
import threading
import tkinter as tk
import tkinter.filedialog as tkfd
import tkinter.ttk as ttk
from server import run_server

var_path = None
var_html = None
var_format = None


def handle(config):
	global var_path, var_html, var_format

	root = tk.Tk()
	root.title("Now Playing Config")

	# var_path = tk.StringVar(value=config["file_path"])
	# var_html = tk.BooleanVar(value=config["wrap_html"])
	var_format = tk.StringVar(value=config["format"])

	frm_install = tk.LabelFrame(text="Install in Firefox", relief=tk.GROOVE, borderwidth=1, padx=10, pady=5)
	frm_install.columnconfigure(0, weight=1)
	frm_install.columnconfigure(1, weight=1)
	btn_install = ttk.Button(master=frm_install, text="Install", command=click_install)
	btn_install.grid(column=0, row=0, padx=5, sticky="we")
	btn_uninstall = ttk.Button(master=frm_install, text="Uninstall", command=click_uninstall)
	btn_uninstall.grid(column=1, row=0, padx=5, sticky="we")
	frm_install.pack(fill=tk.X, padx=10, pady=5)

	# frm_path = tk.LabelFrame(text="Choose File Path", relief=tk.GROOVE, borderwidth=1, padx=10, pady=5)
	# frm_path.columnconfigure(0, weight=3)
	# frm_path.columnconfigure(1, weight=1)
	# etr_path = ttk.Entry(master=frm_path, textvariable=var_path)
	# etr_path.grid(column=0, row=0, padx=5, sticky="we")
	# btn_path = ttk.Button(master=frm_path, text="Browse...", command=click_browse)
	# btn_path.grid(column=1, row=0, padx=5, sticky="we")
	# frm_path.pack(fill=tk.X, padx=10, pady=5)

	frm_output = tk.LabelFrame(text="Text Format", relief=tk.GROOVE, borderwidth=1, padx=10, pady=5)
	# chk_html = ttk.Checkbutton(master=frm_output, text="Output HTML for use with Browser Source", variable=var_html)
	# chk_html.pack(fill=tk.X, padx=5, pady=5)

	etr_format = ttk.Entry(master=frm_output, textvariable=var_format)
	etr_format.pack(fill=tk.X, padx=5, pady=5)

	frm_help = tk.Frame(master=frm_output)
	lbl_help_al = ttk.Label(master=frm_help, text="{$title$}", font=("monospace", 12, "bold"))
	lbl_help_al.grid(column=0, row=0, padx=5, sticky="nw")
	lbl_help_ar = ttk.Label(master=frm_help, text="The current song's title.")
	lbl_help_ar.grid(column=1, row=0, padx=5, sticky="nw")
	lbl_help_bl = ttk.Label(master=frm_help, text="{$artist$}", font=("monospace", 12, "bold"))
	lbl_help_bl.grid(column=0, row=1, padx=5, sticky="nw")
	lbl_help_br = ttk.Label(master=frm_help, text="The current song's artist, can be empty.")
	lbl_help_br.grid(column=1, row=1, padx=5, sticky="nw")
	lbl_help_cl = ttk.Label(master=frm_help, text="{$if_artist$...$}", font=("monospace", 12, "bold"))
	lbl_help_cl.grid(column=0, row=2, padx=5, sticky="nw")
	lbl_help_cr = ttk.Label(
			master=frm_help, wraplength=500,
			text="If the current song has an artist defined, this is replaced with whatever you write in for ... - otherwise, it gets removed. Use this for seperators between title and artist."
		)
	lbl_help_cr.grid(column=1, row=2, padx=5, sticky="nw")
	frm_help.pack(fill=tk.X, pady=5)
	frm_output.pack(fill=tk.X, padx=10, pady=5)

	btn_save = ttk.Button(text="Save Configuration", command=click_save)
	btn_save.pack(fill=tk.X, padx=10, pady=10)

	btn_serve = ttk.Button(text="Serve Page", command=click_serve)
	btn_serve.pack(fill=tk.X, padx=10, pady=10)

	root.mainloop()


def click_install():
	try:
		with open(os.path.join(os.path.dirname(__file__), "be.suyo.firefox_nowplaying.json.base"), "r") as jsonfile:
			newjson = json.load(jsonfile)
		
		if os.name == "nt":
			# Windows
			newjson["path"] = os.path.join(os.path.dirname(__file__), "main.exe")
			with open(os.path.join(os.path.dirname(__file__), "be.suyo.firefox_nowplaying.json"), "w") as jsonfile:
				json.dump(newjson, jsonfile, indent="\t")
			import winreg
			registry = winreg.OpenKey(
					winreg.HKEY_CURRENT_USER, "Software\\Mozilla\\NativeMessagingHosts",
					0, winreg.KEY_ALL_ACCESS | winreg.KEY_WOW64_64KEY
				)
			winreg.SetValue(
					registry, "be.suyo.firefox_nowplaying", winreg.REG_SZ,
					os.path.join(os.path.dirname(__file__), "be.suyo.firefox_nowplaying.json")
				)
			winreg.CloseKey(registry)
		else:
			# Linux / MacOS
			newjson["path"] = os.path.realpath(sys.argv[0])
			with open(os.path.join(
					pathlib.Path.home(), ".mozilla", "native-messaging-hosts", "be.suyo.firefox_nowplaying.json"
				), "w") as jsonfile:
				json.dump(newjson, jsonfile, indent="\t")
		tk.messagebox.showinfo(title="Now Playing Config", message="Now Playing has been connected to Firefox!")
	except Exception as e:
		tk.messagebox.showerror(title="Now Playing Config", message="Failed to install:\n" + str(e))


def click_uninstall():
	try:
		if os.name == "nt":
			# Windows
			import winreg
			registry = winreg.OpenKey(
					winreg.HKEY_CURRENT_USER, "Software\\Mozilla\\NativeMessagingHosts",
					0, winreg.KEY_ALL_ACCESS | winreg.KEY_WOW64_64KEY
				)
			winreg.DeleteValue(registry, "be.suyo.firefox_nowplaying")
			winreg.CloseKey(registry)
		else:
			# Linux / MacOS
			os.unlink(os.path.join(
					pathlib.Path.home(), ".mozilla", "native-messaging-hosts", "be.suyo.firefox_nowplaying.json"
				))
		tk.messagebox.showinfo(title="Now Playing Config", message="Now Playing has been disconnected from Firefox.")
	except Exception as e:
		tk.messagebox.showerror(title="Now Playing Config", message="Failed to uninstall:\n" + str(e))


def click_serve():
	print("Starting server...")
	thread = threading.Thread(target=run_server, args=(8944, ))
	thread.setDaemon(True)
	thread.start()


def click_save():
	try:
		with open(os.path.join(os.path.dirname(__file__), "settings.json"), "w") as configfile:
			json.dump({
				"format": var_format.get(),
			}, configfile, indent="\t")
		tk.messagebox.showinfo(title="Now Playing Config", message="Configuration has been saved!")
	except Exception as e:
		tk.messagebox.showerror(title="Now Playing Config", message="Failed to save the configuration:\n" + str(e))
