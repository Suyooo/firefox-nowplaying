/// <reference types="firefox-webext-browser"/>

/*
 * SITE HANDLERS
 */

/**
 * @callback TitleHandlerFunc
 * @param {string} pageTitle
 * @returns {?{title: string, artist?: string}}
 */

/**
 * @type {Object.<string, TitleHandlerFunc>}
 */
const SITE_HANDLERS = {
	"spotify.com": (pageTitle) => {
		const split = pageTitle.split(" • ");
		if (split.length !== 2) return null;
		return { title: split[0], artist: split[1] };
	},
	"youtube.com": (pageTitle) => {
		if (!pageTitle.endsWith(" - YouTube")) return null;
		return { title: pageTitle.substring(0, pageTitle.length - 10) };
	},
};

/*
 * LISTENERS
 */

browser.action.onClicked.addListener(async () => {
	const followedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
	console.log("Currently following.", followedTabId);
	if (followedTabId !== null) stop();
	else start();
});

browser.tabs.onRemoved.addListener(async (tabId) => {
	const followedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
	console.log("Closed tab.", tabId, "Currently following.", followedTabId);
	if (followedTabId === tabId) stop("The followed tab was closed");
});

browser.tabs.onUpdated.addListener(sendSongTitle);

browser.runtime.onMessage.addListener(() => {
	stop("The followed tab left the page");
});

// Handle onUpdateAvailable to avoid restarts while the plugin is active. Only reload if the connection is stopped
browser.runtime.onUpdateAvailable.addListener(async () => {
	const followedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
	console.log("Update available, currently following.", followedTabId);
	if (followedTabId === null) browser.runtime.reload();
});

/*
 * START / STOP
 */

const TITLE_PREFIX = "🔴 NP | ";

async function start() {
	try {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		console.log("Queried tabs.", tabs);
		if (!tabs || !tabs[0]) {
			sendError("Unknown error trying to find your current tab.");
			return;
		}
		const tab = tabs[0];
		if (!tab.url || !tab.title || !tab.id) {
			sendError("No website loaded in this tab.");
			return;
		}
		const tabHost = getTabHost(tab.url);
		if (!tabHost) {
			sendError("No website loaded in this tab.");
			return;
		}
		if (SITE_HANDLERS[tabHost] == null) {
			sendError(`Now Playing does not support ${tabHost}.`);
			return;
		}

		console.log(`Setting listening tab ID to #${tab.id}`);
		await browser.storage.session.set({ tabId: tab.id });
		sendSongTitle(tab.id, null, tab);

		await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				addEventListener("beforeunload", () => {
					browser.runtime.sendMessage(0);
				});
			},
		});

		updateActionButton(true);
		notify("Started, now following this tab.");
	} catch (e) {
		sendError(e.message);
	}
}

/**
 * @param {string | undefined} [reason]
 */
async function stop(reason) {
	/** @type {?number} */
	const tabId = (await browser.storage.session.get({ tabId: null })).tabId;
	if (tabId === null) return;
	console.log(`Unsetting listening tab ID`);
	await browser.storage.session.set({ tabId: null });
	updateActionButton(false);

	if (tabId) {
		try {
			await browser.scripting.executeScript({
				target: { tabId },
				args: [TITLE_PREFIX],
				func: (/** @type {string} */ tp) => {
					if (document.title.startsWith(tp)) {
						document.title = document.title.substring(tp.length);
					}
				},
			});
		} catch (e) {
			// Ignore error - the tab might have been closed so it doesn't exist anymore
		}
	}

	if (reason) notify(`Stopped (${reason}).`);
	else notify("Stopped.");
}

/*
 * NOTIFICATIONS / UI
 */

/**
 * @param {string} message
 */
function notify(message) {
	browser.notifications.create({
		type: "basic",
		iconUrl: browser.runtime.getURL("icon.svg"),
		title: "Now Playing",
		message,
	});
}

/**
 * @param {string} message
 */
function sendError(message) {
	console.error(message);
	notify(`ERROR: ${message}`);
}

/**
 * @param {boolean} [listening]
 */
function updateActionButton(listening) {
	browser.action.setTitle({ title: listening ? "Stop Now Playing" : "Start Now Playing" });
	browser.action.setBadgeBackgroundColor({ color: "red" });
	browser.action.setBadgeTextColor({ color: "white" });
	browser.action.setBadgeText({ text: listening ? "ON" : "" });
}

/*
 * MESSAGING TO APP
 */

/**
 * @param {string} url
 */
function getTabHost(url) {
	return new URL(url).host.split(".").slice(-2, 99).join(".");
}

/**
 * @param {number} tabId
 * @param {?browser.tabs._OnUpdatedChangeInfo} _changeInfo
 * @param {browser.tabs.Tab} tab
 */
async function sendSongTitle(tabId, _changeInfo, tab) {
	if (tabId != (await browser.storage.session.get({ tabId: null })).tabId) return;
	console.log("Received followed tab update.", tab.url, tab.title);
	if (!tab.url) return;
	const tabHost = getTabHost(tab.url);
	if (!tab.title || !tabHost) return;

	if (tab.title.startsWith(TITLE_PREFIX)) {
		tab.title = tab.title.substring(TITLE_PREFIX.length);
		browser.history.addUrl({ url: tab.url, title: tab.title });
	} else {
		await browser.scripting.executeScript({
			target: { tabId },
			args: [`${TITLE_PREFIX}${tab.title}`],
			func: (/** @type {string} */ title) => {
				document.title = title;
			},
		});
	}

	console.log("Using handler for " + tabHost);
	const handler = SITE_HANDLERS[tabHost];
	if (handler == null) return;
	const result = handler(tab.title);
	if (result == null) return;

	console.log("Sending.", result);
	const ret = await browser.runtime.sendNativeMessage("be.suyo.firefox_nowplaying", result).catch((e) => e);
	console.log("Application replied.", ret);
	if (ret != "1") {
		sendError("Error in desktop application: " + ret);
	}
}
