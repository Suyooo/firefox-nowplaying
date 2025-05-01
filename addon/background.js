/// <reference types="firefox-webext-browser"/>

/** @type {?TitleHandlerFunc} */
let handler = null;

browser.action.onClicked.addListener(async () => {
	console.log("Connecting to native app...");
	try {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		if (!tabs || !tabs[0]) {
			sendError("Unknown error trying to find your current tab.");
			return;
		}
		const tab = tabs[0];
		if (!tab.url || !tab.title) {
			sendError("No page loaded in this tab.");
			return;
		}
		const tabHost = new URL(tab.url).host.split(".").slice(-2, 99).join(".");
		if (!tabHost) {
			sendError("No page loaded in this tab.");
			return;
		}
		const tabPermission = { origins: [`*://*.${tabHost}/`] };
		if (!(await browser.permissions.contains(tabPermission))) {
			sendError(`Missing permissions for ${tabHost}. Please grant permissions, then try again!`, tabPermission);
			return;
		}

		console.log("Listening to tab: ", tab);
		handler = SITE_HANDLERS[tabHost];
		browser.tabs.onUpdated.addListener(sendSongTitle, { tabId: tab.id });
		sendSongTitle(null, null, tab);
	} catch (e) {
		sendError(e.message);
	} finally {
		/* console.log("Disconnecting");
		port.disconnect();
		port = null;
		handler = null;
		browser.tabs.onUpdated.removeListener(sendSongTitle); */
	}
});

/**
 * @param {?number} _tabId
 * @param {?browser.tabs._OnUpdatedChangeInfo} _changeInfo
 * @param {browser.tabs.Tab} tab
 */
async function sendSongTitle(_tabId, _changeInfo, tab) {
	if (!handler || !tab.title) return;
	const result = handler(tab.title);
	if (result == null) return;

	const msg = `${result.title} - ${result.artist}`;
	console.log(msg);
	const ret = await browser.runtime.sendNativeMessage("be.suyo.firefox_songtitle", msg);
	if (ret != "1") {
		sendError("Error in desktop application: " + ret);
	}
}

/**
 * @param {string} message
 * @param {browser.permissions.AnyPermissions} [requestPermission]
 */
function sendError(message, requestPermission) {
	console.error(message);
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
};
