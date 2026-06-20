(function() {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  };

  function getBaseUrl() {
    if (typeof manifest !== "undefined" && manifest.baseUrl) return manifest.baseUrl;
    return "https://besthdgayporn.com";
  }

  function absoluteUrl(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = getBaseUrl().replace(/\/$/, "");
    return url.startsWith("/") ? base + url : base + "/" + url;
  }

  function pickText(el, selector, fallback) {
    const found = el.querySelector(selector);
    const text = found && found.textContent ? found.textContent.trim() : "";
    return text || fallback || "";
  }

  function pickAttr(el, selector, attrs) {
    const found = el.querySelector(selector);
    if (!found) return "";
    for (const attr of attrs) {
      const value = found.getAttribute(attr);
      if (value) return value;
    }
    return "";
  }

  function toMedia(el) {
    const a = el.querySelector("a");
    if (!a) return null;
    const href = absoluteUrl(a.getAttribute("href"));
    if (!href) return null;
    const title = pickText(el, ".aiovg-link-title", "Untitled");
    const poster = absoluteUrl(pickAttr(el, "img", ["data-src", "data-lazy-src", "src"]));
    return new MultimediaItem({
      title: title,
      url: href,
      posterUrl: poster,
      type: "movie"
    });
  }

  function parseCards(doc) {
    return Array.from(doc.querySelectorAll("div.aiovg-item-video"))
      .map(toMedia)
      .filter(Boolean);
  }

  async function getHome(cb) {
    try {
      const categories = [
        { name: "Latest", path: "/" },
        { name: "MEN.com", path: "/video-tag/men-com/" },
        { name: "Bareback", path: "/video-tag/bareback-gay-porn/" },
        { name: "Onlyfans", path: "/video-tag/onlyfans/" },
        { name: "Latino", path: "/video-tag/latino/" },
        { name: "Chaos Men", path: "/video-tag/chaos-men/" },
        { name: "Naked Sword", path: "/video-tag/nakedsword/" }
      ];
      const data = {};
      for (const cat of categories) {
        try {
          const res = await http_get(getBaseUrl().replace(/\/$/, "") + cat.path, headers);
          const doc = await parseHtml(res.body || "");
          const items = parseCards(doc);
          if (items.length) data[cat.name] = items;
        } catch (e) {}
      }
      cb({ success: true, data: data });
    } catch (e) {
      cb({ success: false, errorCode: "HOME_ERROR", message: e.message });
    }
  }

  async function search(query, cb) {
    try {
      const res = await http_get(`${getBaseUrl().replace(/\/$/, "")}/?s=${encodeURIComponent(query || "")}`, headers);
      const doc = await parseHtml(res.body || "");
      cb({ success: true, data: parseCards(doc) });
    } catch (e) {
      cb({ success: false, errorCode: "SEARCH_ERROR", message: e.message });
    }
  }

  async function load(url, cb) {
    try {
      const res = await http_get(url, headers);
      const doc = await parseHtml(res.body || "");
      const title = doc.querySelector("meta[property='og:title']")?.getAttribute("content") || doc.querySelector("h1")?.textContent?.trim() || "Untitled";
      const poster = absoluteUrl(doc.querySelector("meta[property='og:image']")?.getAttribute("content") || doc.querySelector("video[poster]")?.getAttribute("poster") || "");
      const description = doc.querySelector("meta[property='og:description']")?.getAttribute("content") || "";
      cb({
        success: true,
        data: new MultimediaItem({
          title: title,
          url: url,
          posterUrl: poster,
          description: description,
          type: "movie"
        })
      });
    } catch (e) {
      cb({ success: false, errorCode: "LOAD_ERROR", message: e.message });
    }
  }

  function addVideoMatches(html, out) {
    const urlRegex = /https?:\/\/[^\s'"<>]+?\.(?:mp4|m3u8|webm)(\?[^'"\s<>]*)?/gi;
    let match;
    while ((match = urlRegex.exec(html || "")) !== null) {
      out.add(match[0].replace(/&amp;/g, "&"));
    }
  }

  async function loadStreams(url, cb) {
    try {
      const res = await http_get(url, { ...headers, Referer: url });
      const html = res.body || "";
      const found = new Set();
      addVideoMatches(html, found);
      const doc = await parseHtml(html);
      Array.from(doc.querySelectorAll("video[src], source[src], video[data-src], source[data-src]")).forEach(el => {
        const direct = absoluteUrl(el.getAttribute("src") || el.getAttribute("data-src"));
        if (direct) found.add(direct);
      });
      const iframes = Array.from(doc.querySelectorAll("iframe[src]")).map(el => absoluteUrl(el.getAttribute("src"))).filter(Boolean);
      for (const frameUrl of iframes) {
        try {
          const frame = await http_get(frameUrl, { ...headers, Referer: url });
          addVideoMatches(frame.body || "", found);
        } catch (e) {}
      }
      const streams = Array.from(found).map((streamUrl, index) => new StreamResult({
        url: streamUrl,
        source: streamUrl.includes("besthdgayporn") ? `Origin ${index + 1}` : `Direct ${index + 1}`
      }));
      cb({ success: true, data: streams });
    } catch (e) {
      cb({ success: false, errorCode: "STREAM_ERROR", message: e.message });
    }
  }

  globalThis.getHome = getHome;
  globalThis.search = search;
  globalThis.load = load;
  globalThis.loadStreams = loadStreams;
})();
