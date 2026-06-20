/*
 * SkyStream plugin for BestHDgayporn
 *
 * This plugin implements the four required SkyStream functions—getHome, search,
 * load and loadStreams—using plain HTTP requests and HTML parsing. It
 * dynamically uses the `manifest.baseUrl` value provided by the app to
 * construct all requests, which allows domain switching without code changes.
 *
 * The implementation is intentionally minimalist: it scrapes the home page
 * for video cards, performs simple search queries, extracts metadata from
 * individual video pages, and looks for direct video file links on the page
 * and in any embedded iframes. If no streams are found, it simply returns
 * an empty list rather than throwing an error.
 */

(() => {
  /**
   * Internal helper to get the current base URL. The manifest object is
   * injected by the SkyStream runtime and contains user-selected domain
   * overrides. Falling back to the default ensures the plugin continues to
   * function if the manifest is missing or incomplete.
   * @returns {string}
   */
  function getBaseUrl() {
    if (typeof manifest !== 'undefined' && manifest.baseUrl) {
      return manifest.baseUrl;
    }
    return 'https://besthdgayporn.com';
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  };

  /**
   * Convert an element representing a video card into a MultimediaItem. The
   * returned objects contain only the bare minimum fields expected by the
   * SkyStream UI: title, URL, poster and type. Any missing data is replaced
   * with sensible defaults.
   * @param {Element} element
   * @returns {MultimediaItem|null}
   */
  function toMediaItem(element) {
    const link = element.querySelector('a');
    if (!link) return null;
    const href = link.getAttribute('href');
    const img = element.querySelector('img');
    let poster =
      (img && (img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('src'))) || '';
    const titleEl = element.querySelector('.aiovg-link-title');
    const title = (titleEl && titleEl.textContent && titleEl.textContent.trim()) || 'Untitled';
    return new MultimediaItem({
      title: title,
      url: href,
      posterUrl: poster,
      type: 'movie',
    });
  }

  /**
   * Scrape a page for video cards and convert them to items.
   * @param {Document} doc
   * @returns {MultimediaItem[]}
   */
  function scrapeCards(doc) {
    const cards = doc.querySelectorAll('div.aiovg-item-video');
    const items = [];
    cards.forEach((el) => {
      const item = toMediaItem(el);
      if (item) items.push(item);
    });
    return items;
  }

  /**
   * Entry point for the home screen. It fetches the base URL and parses the
   * home page for a list of recent videos. All videos are grouped under a
   * single "Latest" category. If an error occurs, it returns an empty
   * dataset to avoid crashing the app.
   * @param {function} cb
   */
  async function getHome(cb) {
    try {
      const url = getBaseUrl() + '/';
      const res = await http_get(url, headers);
      const doc = await parseHtml(res.body);
      const items = scrapeCards(doc);
      const data = { Latest: items };
      cb({ success: true, data });
    } catch (err) {
      cb({ success: true, data: {} });
    }
  }

  /**
   * Handle user search queries. Performs a GET request to the site's search
   * endpoint and returns a flat list of items. If the query is empty or an
   * error occurs, the callback is invoked with an empty array.
   * @param {string} query
   * @param {function} cb
   */
  async function search(query, cb) {
    try {
      if (!query) return cb({ success: true, data: [] });
      const url = `${getBaseUrl()}/?s=${encodeURIComponent(query)}`;
      const res = await http_get(url, headers);
      const doc = await parseHtml(res.body);
      const items = scrapeCards(doc);
      cb({ success: true, data: items });
    } catch (err) {
      cb({ success: true, data: [] });
    }
  }

  /**
   * Load detailed information for a specific video. Extracts the title,
   * description and poster from standard meta tags. Fallbacks are provided
   * for sites that omit metadata. The returned MultimediaItem uses the
   * original URL as both its URL and data identifier.
   * @param {string} url
   * @param {function} cb
   */
  function load(url, cb) {
    (async () => {
      try {
        const res = await http_get(url, headers);
        const doc = await parseHtml(res.body);
        const title =
          doc.querySelector("meta[property='og:title']")?.getAttribute('content') || doc.title || '';
        const poster =
          doc.querySelector("meta[property='og:image']")?.getAttribute('content') ||
          doc.querySelector('video')?.getAttribute('poster') ||
          '';
        const description =
          doc.querySelector("meta[property='og:description']")?.getAttribute('content') || '';
        const item = new MultimediaItem({
          title: title || 'Untitled',
          url: url,
          posterUrl: poster,
          description: description,
          type: 'movie',
        });
        cb({ success: true, data: item });
      } catch (err) {
        cb({ success: false, errorCode: 'LOAD_ERROR', message: err.message });
      }
    })();
  }

  /**
   * Recursively parse a page for playable video URLs. This helper scans the
   * provided HTML for direct video file references, <video> and <source>
   * tags, and embedded scripts containing file paths. It will traverse
   * nested iframes up to one level deep to handle players embedded within
   * players. All discovered links are added to the provided Set.
   *
   * @param {string} pageUrl The URL for the current document, used as Referer when fetching nested frames.
   * @param {string} html The HTML content to scan.
   * @param {number} depth Current recursion depth.
   * @param {Set<string>} found A set to collect discovered video URLs.
   */
  async function parseForStreams(pageUrl, html, depth, found) {
    // Regex search in raw HTML for .mp4/.m3u8/.webm links
    addVideoMatches(html, found);
    const doc = await parseHtml(html);
    // Extract from <video> and <source> elements
    Array.from(doc.querySelectorAll('video[src], source[src], video[data-src], source[data-src]')).forEach((el) => {
      const direct = el.getAttribute('src') || el.getAttribute('data-src');
      if (direct) {
        const abs = absoluteUrl(direct);
        if (abs) found.add(abs);
      }
    });
    // Check inline scripts for file references
    Array.from(doc.querySelectorAll('script')).forEach((script) => {
      const code = script.textContent || '';
      addVideoMatches(code, found);
    });
    // Dive into nested iframes (limit depth to 1)
    if (depth < 1) {
      const frameEls = doc.querySelectorAll('iframe[src]');
      for (const frame of frameEls) {
        const src = frame.getAttribute('src');
        if (!src) continue;
        const frameUrl = absoluteUrl(src);
        try {
          const frameRes = await http_get(frameUrl, { ...headers, Referer: pageUrl });
          const frameHtml = frameRes.body || '';
          await parseForStreams(frameUrl, frameHtml, depth + 1, found);
        } catch {
          // Ignore nested iframe failures
        }
      }
    }
  }

  async function loadStreams(url, cb) {
    try {
      const res = await http_get(url, headers);
      const html = res.body || '';
      const found = new Set();
      await parseForStreams(url, html, 0, found);
      const streams = [];
      let index = 1;
      found.forEach((link) => {
        const source = link.includes('besthdgayporn') ? `Origin ${index}` : `Direct ${index}`;
        streams.push(new StreamResult({ url: link, source }));
        index++;
      });
      cb({ success: true, data: streams });
    } catch (err) {
      cb({ success: false, errorCode: 'STREAM_ERROR', message: err.message });
    }
  }

  globalThis.getHome = getHome;
  globalThis.search = search;
  globalThis.load = load;
  globalThis.loadStreams = loadStreams;
})();
