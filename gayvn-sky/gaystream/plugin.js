(function() {
    /**
     * @type {import('@skystream/sdk').Manifest}
     */
    // var manifest is injected at runtime

    const MAIN_URL = manifest.baseUrl;

    async function getHome(cb) {
        try {
            const pageUrl = MAIN_URL;
            const res = await http_get(pageUrl, { "User-Agent": "Mozilla/5.0" });
            const html = res.body || "";
            const items = _parseMovies(html);
            
            cb({ 
                success: true, 
                data: { 
                    "Latest": items
                } 
            });
        } catch (e) {
            cb({ success: false, errorCode: "PARSE_ERROR", message: e.stack });
        }
    }

    function _parseMovies(html) {
        const results = [];
        const items = html.split('<div class="grid-item');
        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const titleMatch = item.match(/title="(.*?)"/);
            const hrefMatch = item.match(/href="(.*?)"/);
            const imgMatch = item.match(/<img class="item-img" src="(.*?)"/);
            
            if (titleMatch && hrefMatch) {
                results.push(new MultimediaItem({
                    title: titleMatch[1].replace(/&#038;/g, '&').replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
                    url: hrefMatch[1].startsWith('http') ? hrefMatch[1] : MAIN_URL + hrefMatch[1],
                    posterUrl: imgMatch ? imgMatch[1] : "",
                    type: "movie"
                }));
            }
        }
        return results;
    }

    async function search(query, cb) {
        try {
            const results = [];
            for (let i = 1; i <= 3; i++) {
                const searchUrl = `${MAIN_URL}/?s=${encodeURIComponent(query)}&page=${i}`;
                const res = await http_get(searchUrl, { "User-Agent": "Mozilla/5.0" });
                const html = res.body || "";
                const items = _parseMovies(html);
                if (items.length === 0) break;
                results.push(...items);
            }
            cb({ success: true, data: results });
        } catch (e) {
            cb({ success: false, errorCode: "SEARCH_ERROR", message: e.stack });
        }
    }

    async function load(url, cb) {
        try {
            const res = await http_get(url, { "User-Agent": "Mozilla/5.0" });
            const html = res.body || "";
            
            const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
            const posterMatch = html.match(/<meta property="og:image" content="(.*?)"/);
            const descMatch = html.match(/<meta property="og:description" content="(.*?)"/);
            
            const recommendations = _parseMovies(html);

            cb({ 
                success: true, 
                data: new MultimediaItem({
                    title: titleMatch ? titleMatch[1].trim() : "",
                    url: url,
                    posterUrl: posterMatch ? posterMatch[1] : "",
                    type: "movie",
                    description: descMatch ? descMatch[1].trim() : "",
                    recommendations: recommendations
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
            
            // Extract from buttons with onclick
            const onclickMatches = html.matchAll(/onclick="document\.getElementById\('ifr'\)\.src='(.*?)'/g);
            for (const match of onclickMatches) {
                streams.push(new StreamResult({ url: match[1], source: "Provider" }));
            }
            
            // Fallback iframe
            const iframeMatch = html.match(/<iframe id="ifr" src="(.*?)"/);
            if (iframeMatch && streams.length === 0) {
                streams.push(new StreamResult({ url: iframeMatch[1], source: "Main Server" }));
            }
            
            // Download button
            const downloadMatch = html.match(/<a class="video-download" href="(.*?)"/);
            if (downloadMatch) {
                streams.push(new StreamResult({ url: downloadMatch[1], source: "Download" }));
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
