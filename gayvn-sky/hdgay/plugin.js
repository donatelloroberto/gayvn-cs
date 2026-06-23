(function() {
    /**
     * @type {import('@skystream/sdk').Manifest}
     */
    // var manifest is injected at runtime

    const MAIN_URL = manifest.baseUrl;

    async function getHome(cb) {
        try {
            const res = await http_get(MAIN_URL, { "User-Agent": "Mozilla/5.0" });
            const html = res.body || "";
            const items = _parseItems(html);
            cb({ success: true, data: { "Latest": items } });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: e.stack });
        }
    }

    function _parseItems(html) {
        const results = [];
        const items = html.split('<div class="videopost');
        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const titleMatch = item.match(/title="(.*?)"/);
            const hrefMatch = item.match(/href="(.*?)"/);
            const imgMatch = item.match(/src="(.*?)"/);
            
            if (titleMatch && hrefMatch) {
                results.push(new MultimediaItem({
                    title: titleMatch[1],
                    url: hrefMatch[1],
                    posterUrl: imgMatch ? imgMatch[1] : "",
                    type: "movie"
                }));
            }
        }
        return results;
    }

    async function search(query, cb) {
        try {
            const searchUrl = `${MAIN_URL}/?s=${encodeURIComponent(query)}`;
            const res = await http_get(searchUrl, { "User-Agent": "Mozilla/5.0" });
            const html = res.body || "";
            cb({ success: true, data: _parseItems(html) });
        } catch (e) {
            cb({ success: false, errorCode: "SEARCH_ERROR", message: e.stack });
        }
    }

    async function load(url, cb) {
        try {
            const res = await http_get(url, { "User-Agent": "Mozilla/5.0" });
            const html = res.body || "";
            const titleMatch = html.match(/<h1 class="entry-title">(.*?)<\/h1>/);
            cb({ 
                success: true, 
                data: new MultimediaItem({
                    title: titleMatch ? titleMatch[1].trim() : "",
                    url: url,
                    type: "movie"
                })
            });
        } catch (e) {
            cb({ success: false, errorCode: "LOAD_ERROR", message: e.stack });
        }
    }

    async function loadStreams(url, cb) {
        try {
            const res = await http_get(url, { "User-Agent": "Mozilla/5.0" });
            const html = res.body || "";
            const streams = [];
            const iframeMatch = html.match(/<iframe.*?src="(.*?)"/);
            if (iframeMatch) {
                streams.push(new StreamResult({ url: iframeMatch[1], source: "Iframe" }));
            }
            cb({ success: true, data: streams });
        } catch (e) {
            cb({ success: false, errorCode: "STREAM_ERROR", message: String(e) });
        }
    }

    globalThis.getHome = getHome;
    globalThis.search = search;
    globalThis.load = load;
    globalThis.loadStreams = loadStreams;
})();
