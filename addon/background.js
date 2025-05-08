/// <reference types="firefox-webext-browser"/>

/*
 * SITE HANDLERS
 */

/**
 * @typedef Metadata
 * @property {?string} title
 * @property {?string} artist
 * @property {?string} album
 * @property {?string} artwork
 */

/**
 * @callback MetadataHandlerFunc
 * @param {Metadata} metadata
 * @returns {?Metadata}
 */

/**
 * @type {Object.<string, MetadataHandlerFunc>}
 */
const SITE_HANDLERS = {
	"open.spotify.com": (metadata) => {
		if (metadata.artist == null && metadata.album == null) {
			// Ads on Spotify have no artist or album. Skip these!
			return null;
		}
		return metadata;
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

browser.runtime.onMessage.addListener(
	async (/** @type ('unload') | {metadata: ?MediaMetadata, host: string} */ message) => {
		console.log("Received message.", message);
		if (message === "unload") {
			const trackedTabId = (await browser.storage.session.get({ tabId: null })).tabId;
			stop(trackedTabId, "The tracked tab left the page");
		} else if (message.metadata != null) {
			/** @type Metadata */
			const metadata = {
				title: message.metadata.title || null,
				artist: message.metadata.artist || null,
				album: message.metadata.album || null,
				artwork: null,
			};

			let bestArtwork = message.metadata.artwork?.[0];
			for (const a of message.metadata.artwork.slice(1)) {
				if (a?.sizes && (!bestArtwork?.sizes || parseInt(a.sizes) > parseInt(bestArtwork.sizes))) {
					bestArtwork = a;
				}
			}
			metadata.artwork = bestArtwork?.src;

			console.log("Processed metadata.", metadata);
			const handledMetadata =
				SITE_HANDLERS[message.host] == undefined ? metadata : SITE_HANDLERS[message.host](metadata);
			console.log("Handled metadata.", handledMetadata);
			if (handledMetadata != null) sendSongTitle(metadata);
		}
	}
);

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

		console.log(`Setting tracked tab ID to #${tab.id}`);
		await browser.storage.session.set({ tabId: tab.id });

		await browser.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				function unloadHandler() {
					browser.runtime.sendMessage("unload");
					removeEventListener("beforeunload", unloadHandler);
				}
				addEventListener("beforeunload", unloadHandler);

				let stopUpdate = false;
				function messageHandler(/** @type ('stop') */ message) {
					if (message === "stop") stopUpdate = true;
					browser.runtime.onMessage.removeListener(messageHandler);
				}
				browser.runtime.onMessage.addListener(messageHandler);

				let previousMetadata = null;
				function update() {
					if (navigator.mediaSession.metadata && navigator.mediaSession.metadata != previousMetadata) {
						console.log("Metadata updated.", navigator.mediaSession.metadata);
						previousMetadata = navigator.mediaSession.metadata;
						// MediaMetadata is a weird fake object that can't be serialized. Workaround:
						browser.runtime.sendMessage({
							host: window.location.host,
							metadata: {
								title: previousMetadata.title,
								artist: previousMetadata.artist,
								album: previousMetadata.album,
								artwork: previousMetadata.artwork,
							},
						});
					}
					if (!stopUpdate) setTimeout(update, 1000);
				}
				update();
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
 * @param {string} url
 */
function getTabHost(url) {
	return new URL(url).host.split(".").slice(-2, 99).join(".");
}

/**
 * @param {Metadata} metadata
 */
async function sendSongTitle(metadata) {
	console.log("Sending.", metadata);
	const ret = await browser.runtime.sendNativeMessage("be.suyo.firefox_nowplaying", metadata).catch((e) => e);
	console.log("Application replied.", ret);
	if (ret != "1") {
		sendError("Error in desktop application: " + ret);
	}
}
