try {
	/*
	 * SITE HANDLERS
	 */

	/**
	 * @callback MetadataHandlerFunc
	 * @param {MediaMetadata} metadata
	 * @returns {?MediaMetadata}
	 */

	/**
	 * @type {Object.<string, MetadataHandlerFunc>}
	 */
	const SITE_HANDLERS = {
		"spotify.com": (metadata) => {
			if (metadata.artist || metadata.album) {
				return metadata;
			}
			// Ads on Spotify have no artist or album. Skip these!
			return null;
		},
	};

	/** @type {?MetadataHandlerFunc} */
	const siteHandler = SITE_HANDLERS[window.location.host.split(".").slice(-2).join(".")];
	console.log("Using site handler: ", siteHandler);

	/*
	 * UNLOAD / STOP
	 */

	function unloadHandler() {
		try {
			browser.runtime.sendMessage("unload");
			removeEventListener("beforeunload", unloadHandler);
		} catch (e) {
			console.error(e);
		}
	}
	addEventListener("beforeunload", unloadHandler);

	let stopUpdate = false;
	function messageHandler(/** @type ('stop') */ message) {
		try {
			if (message === "stop") {
				stopUpdate = true;
				browser.runtime.onMessage.removeListener(messageHandler);
			}
		} catch (e) {
			console.error(e);
		}
	}
	browser.runtime.onMessage.addListener(messageHandler);

	/*
	 * MEDIA METADATA
	 */

	/** @type {string | null} */
	let previousHandledMetadata = null;

	function update() {
		try {
			if (navigator.mediaSession.metadata) {
				// MediaMetadata is a weird fake object that can't be serialized. Workaround:
				/** @type MediaMetadata | null */
				let metadataClone = {
					title: navigator.mediaSession.metadata.title,
					artist: navigator.mediaSession.metadata.artist,
					album: navigator.mediaSession.metadata.album,
					artwork: navigator.mediaSession.metadata.artwork,
				};

				const metadataStringified = JSON.stringify(metadataClone);
				if (metadataStringified === previousHandledMetadata) {
					// Avoid sending the same info multiple times
					return;
				}
				console.log("Metadata updated.", navigator.mediaSession.metadata);

				if (siteHandler) {
					metadataClone = siteHandler(metadataClone);

					// Handler functions can stop a metadata from being sent by returning null
					if (metadataClone === null) {
						console.log("Update was rejected by site handler");
						return;
					}
				}

				previousHandledMetadata = metadataStringified;
				browser.runtime.sendMessage({
					host: window.location.host,
					metadata: metadataClone,
				});
			}
		} catch (e) {
			console.error(e);
		} finally {
			if (!stopUpdate) setTimeout(update, 1000);
		}
	}
	update();
} catch (e) {
	console.error(e);
}
