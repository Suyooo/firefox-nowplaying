/// <reference types="firefox-webext-browser"/>

/** @type {boolean} */
let listening = false;

browser.action.onClicked.addListener(async () => {
	console.log("Is listening: " + listening);
	if (listening) unlisten();
	else listen();
});

async function listen() {
	try {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		console.log("Queried tabs.", tabs);
		if (!tabs || !tabs[0]) {
			sendError("Unknown error trying to find your current tab.");
			return;
		}
		const tab = tabs[0];
		if (!tab.url || !tab.title) {
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

		console.log(`Adding listener on tab #${tab.id}`);
		browser.tabs.onUpdated.addListener(sendSongTitle, { tabId: tab.id });
		sendSongTitle(null, null, tab);

		listening = true;
		updateActionButton();
		notify("Started, now following this tab.");
	} catch (e) {
		sendError(e.message);
	}
}

async function unlisten() {
	console.log(`Removing listener`);
	browser.tabs.onUpdated.removeListener(sendSongTitle);
	listening = false;
	updateActionButton();
	notify("Stopped.");
}

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

function updateActionButton() {
	browser.action.setTitle({ title: listening ? "Stop Now Playing" : "Start Now Playing" });
	browser.action.setBadgeBackgroundColor({ color: "red" });
	browser.action.setBadgeTextColor({ color: "white" });
	browser.action.setBadgeText({ text: listening ? "ON" : "" });
}

/**
 * @param {string} url
 */
function getTabHost(url) {
	return new URL(url).host.split(".").slice(-2, 99).join(".");
}

/**
 * @param {?number} _tabId
 * @param {?browser.tabs._OnUpdatedChangeInfo} _changeInfo
 * @param {browser.tabs.Tab} tab
 */
async function sendSongTitle(_tabId, _changeInfo, tab) {
	console.log("Received tab update.", tab.url, tab.title);
	if (!tab.url || !tab.title) return;
	const tabHost = getTabHost(tab.url);
	if (!tabHost) return;

	console.log("Using handler for " + tabHost);
	const handler = SITE_HANDLERS[tabHost];
	if (handler == null) sendError(`Now Playing does not support ${tabHost}.`);
	const result = handler(tab.title);
	if (result == null) return;

	console.log("Sending.", result);
	const ret = await browser.runtime.sendNativeMessage("be.suyo.firefox_songtitle", result);
	console.log("Application replied.", ret);
	if (ret != "1") {
		sendError("Error in desktop application: " + ret);
	}
}

/**
 * @param {string} message
 */
function sendError(message) {
	console.error(message);
	notify(`ERROR: ${message}`);
}

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
