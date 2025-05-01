import tkinter as tk
import tkinter.ttk as ttk


def handle(config):
	root = tk.Tk()
	root.title = "Now Playing Config"
	style = ttk.Style(root)
	style.theme_use("alt")

	var_html = tk.BooleanVar(value=config["wrap_html"])

	frm_install = tk.LabelFrame(text="Install in Firefox", relief=tk.GROOVE, borderwidth=1, padx=10, pady=5)
	frm_install.columnconfigure(0, weight=1)
	frm_install.columnconfigure(1, weight=1)
	btn_install = ttk.Button(master=frm_install, text="Install")
	btn_install.grid(column=0, row=0, padx=5, sticky="we")
	btn_uninstall = ttk.Button(master=frm_install, text="Uninstall")
	btn_uninstall.grid(column=1, row=0, padx=5, sticky="we")
	frm_install.pack(fill=tk.X, padx=10, pady=5)

	frm_path = tk.LabelFrame(text="Choose File Path", relief=tk.GROOVE, borderwidth=1, padx=10, pady=5)
	frm_path.columnconfigure(0, weight=3)
	frm_path.columnconfigure(1, weight=1)
	etr_path = ttk.Entry(master=frm_path)
	etr_path.grid(column=0, row=0, padx=5, sticky="we")
	btn_path = ttk.Button(master=frm_path, text="Browse...")
	btn_path.grid(column=1, row=0, padx=5, sticky="we")
	frm_path.pack(fill=tk.X, padx=10, pady=5)

	frm_output = tk.LabelFrame(text="Output Format", relief=tk.GROOVE, borderwidth=1, padx=10, pady=5)
	chk_html = ttk.Checkbutton(master=frm_output, text="Output HTML for use with Browser Source",
                            variable=var_html)
	chk_html.pack(fill=tk.X, padx=5, pady=5)

	frm_format = tk.Frame(master=frm_output)
	lbl_format = ttk.Label(master=frm_format, text="Text Format")
	lbl_format.pack(side=tk.LEFT, expand=False, padx=5)
	etr_format = ttk.Entry(master=frm_format)
	etr_format.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
	frm_format.pack(fill=tk.X, pady=5)

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
	lbl_help_cr = ttk.Label(master=frm_help, wraplength=500,
                         text="If the current song has an artist defined, this is replaced with whatever you write in for ... - otherwise, it gets removed. Use this for seperators between title and artist.")
	lbl_help_cr.grid(column=1, row=2, padx=5, sticky="nw")
	frm_help.pack(fill=tk.X, pady=5)
	frm_output.pack(fill=tk.X, padx=10, pady=5)

	btn_save = ttk.Button(text="Save Configuration")
	btn_save.pack(fill=tk.X, padx=10, pady=10)

	root.mainloop()
