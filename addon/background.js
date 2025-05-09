/// <reference types="firefox-webext-browser"/>

/*
 * LISTENERS
 */

/**
 * @typedef ProcessedMetadata
 * @property {?string} title
 * @property {?string} artist
 * @property {?string} album
 * @property {?string} artwork
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

browser.runtime.onMessage.addListener(async (/** @type ('unload') | ?MediaMetadata */ message) => {
	console.log("Received message.", message);
	if (message === "unload") {
		const trackedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
		stop(trackedTabId, "The tracked tab left the page");
	} else if (message != null) {
		/** @type ProcessedMetadata */
		const metadata = {
			title: message.title || null,
			artist: message.artist || null,
			album: message.album || null,
			artwork: null,
		};

		let bestArtwork = message.artwork?.[0];
		for (const a of message.artwork.slice(1)) {
			if (a?.sizes && (!bestArtwork?.sizes || parseInt(a.sizes) > parseInt(bestArtwork.sizes))) {
				bestArtwork = a;
			}
		}
		metadata.artwork = bestArtwork?.src;

		sendSongTitle(metadata);
	}
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
		const url = new URL(tab.url);
		if (!url.host) {
			sendError("No website loaded in this tab.");
			return;
		}

		console.log("Injecting script");
		await browser.scripting.executeScript({
			target: { tabId: tab.id },
			files: ["content.js"],
		});

		console.log(`Setting tracked tab ID to #${tab.id}`);
		await browser.storage.session.set({ tabId: tab.id });

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

	browser.tabs.sendMessage(tabId, "stop");

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
 * @param {ProcessedMetadata} metadata
 */
async function sendSongTitle(metadata) {
	const message = {
		...metadata,
		version: parseInt(browser.runtime.getManifest().version.split(".")[0]),
	};
	console.log("Sending.", message);
	const ret = await browser.runtime.sendNativeMessage("be.suyo.firefox_nowplaying", message).catch((e) => e);
	console.log("Application replied.", ret);
	if (ret != "1") {
		sendError("Error in desktop application: " + ret);
	}
}
