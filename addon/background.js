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
	const trackedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
	const currentTabsQuery = await browser.tabs.query({ currentWindow: true, active: true });
	console.log("Queried tabs.", currentTabsQuery);
	if (!currentTabsQuery || !currentTabsQuery[0]) {
		sendError("Unknown error trying to find your current tab.");
		return;
	}
	const currentTab = currentTabsQuery[0];

	console.log("Currently tracking.", trackedTabId, "Currently focused.", currentTab.id);
	if (trackedTabId !== null) {
		if (currentTab.id === trackedTabId) {
			stop(trackedTabId);
		} else if (currentTab.id) {
			const trackedTab = await browser.tabs.get(trackedTabId);
			if (trackedTab?.id) browser.tabs.update(trackedTab.id, { active: true });
		}
	} else {
		start(currentTab);
	}
});

browser.tabs.onUpdated.addListener(sendSongTitle, { urls: ["<all_urls>"] });

// Currently only used for notifying the background script of unload events, so no further checks needed
browser.runtime.onMessage.addListener(async () => {
	const trackedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
	stop(trackedTabId, "The tracked tab left the page");
});

// Handle onUpdateAvailable to avoid restarts while the extension is active. Only reload if no tab is tracked
browser.runtime.onUpdateAvailable.addListener(async () => {
	const trackedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
	console.log("Update available, currently tracking.", trackedTabId);
	if (trackedTabId === null) browser.runtime.reload();
});

/*
 * START / STOP
 */

/**
 * @param {browser.tabs.Tab} tab
 */
async function start(tab) {
	try {
		if (!tab || !tab.url || !tab.title || !tab.id) {
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

		console.log(`Setting tracked tab ID to #${tab.id}`);
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

		notify("Started, now tracking this tab.");
		updateActionButton(true, tab.id);
	} catch (e) {
		sendError(e.message);
	}
}

/**
 * @param {number} tabId
 * @param {?string} reason
 */
async function stop(tabId, reason = null) {
	if (tabId === null) return;
	console.log(`Unsetting tracked tab ID`);
	await browser.storage.session.set({ tabId: null });
	updateActionButton(false, tabId);

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
		iconUrl: browser.runtime.getURL("icon-notification.png"),
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
 * @param {boolean} active
 * @param {number} tabId
 */
function updateActionButton(active, tabId) {
	if (!active) {
		browser.action.setTitle({ title: "Start Now Playing" });
		// These will fail if the tab was closed. Ignore.
		browser.action.setBadgeBackgroundColor({ color: null, tabId }).catch(() => null);
		browser.action.setBadgeTextColor({ color: null, tabId }).catch(() => null);
		browser.action.setBadgeText({ text: "" });
	} else {
		browser.action.setTitle({ title: "Stop Now Playing" });
		browser.action.setBadgeBackgroundColor({ color: "white" });
		browser.action.setBadgeTextColor({ color: "black" });
		browser.action.setBadgeBackgroundColor({ color: "red", tabId });
		browser.action.setBadgeTextColor({ color: "white", tabId });
		browser.action.setBadgeText({ text: "ON" });
	}
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
	console.log("Received tracked tab update.", tab.url, tab.title);
	if (!tab.url) return;
	const tabHost = getTabHost(tab.url);
	if (!tab.title || !tabHost) return;

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
