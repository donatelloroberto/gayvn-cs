(() => {
  const CONFIG = {
  "internalName": "Fxggxt",
  "name": "Fxggxt",
  "packageName": "com.gayvn.fxggxt",
  "version": 1,
  "baseUrl": "https://fxggxt.com",
  "description": "(VPN) Premium porn with 4K support",
  "iconUrl": "https://fxggxt.com/wp-content/uploads/2021/04/cropped-Logopit_1617545426773.png",
  "authors": [
    "GayXXX"
  ],
  "languages": [
    "en"
  ],
  "categories": [
    "NSFW"
  ],
  "home": [
    {
      "name": "Amateur",
      "url": "https://fxggxt.com/tag/amateur-gay-porn/"
    },
    {
      "name": "Bareback",
      "url": "https://fxggxt.com/tag/bareback-gay-porn/"
    },
    {
      "name": "Big Dick",
      "url": "https://fxggxt.com/tag/big-dick-gay-porn/"
    },
    {
      "name": "Bisexual",
      "url": "https://fxggxt.com/tag/bisexual-porn/"
    },
    {
      "name": "Group",
      "url": "https://fxggxt.com/tag/group-gay-porn/"
    },
    {
      "name": "Hunk",
      "url": "https://fxggxt.com/tag/hunk-gay-porn-videos/"
    },
    {
      "name": "Interracial",
      "url": "https://fxggxt.com/tag/interracial-gay-porn/"
    },
    {
      "name": "Muscle",
      "url": "https://fxggxt.com/tag/muscle-gay-porn/"
    },
    {
      "name": "Straight",
      "url": "https://fxggxt.com/tag/straight-guys-gay-porn/"
    },
    {
      "name": "Twink",
      "url": "https://fxggxt.com/tag/twink-gay-porn/"
    }
  ],
  "cardSelectors": [
    "article.loop-video.thumb-block",
    "#video-actors a",
    "meta[itemprop='thumbnailUrl']",
    "meta[itemprop='name']",
    "meta[itemprop='description']",
    "article[itemtype='http://schema.org/VideoObject']",
    ".post-thumbnail-container img",
    "header.entry-header span",
    "div.responsive-player iframe",
    "a",
    "article",
    ".video-item"
  ],
  "searchTemplates": [
    "/?s={query}",
    "/page/2/?s={query}",
    "/page/3/?s={query}"
  ],
  "sourceFile": "Fxggxt/src/main/kotlin/com/Fxggxt/Fxggxt.kt"
};
  const BASE = (CONFIG.baseUrl || '').replace(/\/$/, '');
  const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };

  function baseUrl() {
    if (typeof manifest !== 'undefined' && manifest.baseUrl) return String(manifest.baseUrl).replace(/\/$/, '');
    return BASE;
  }

  function absUrl(url, origin) {
    if (!url) return '';
    url = String(url).trim().replace(/&amp;/g, '&').replace(/\\\//g, '/');
    if (!url || url === '#' || url.startsWith('javascript:')) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (/^https?:\/\//i.test(url)) return url;
    const root = (origin || baseUrl()).replace(/\/$/, '');
    if (url.startsWith('/')) {
      try { const m = root.match(/^(https?:\/\/[^\/]+)/i); return (m ? m[1] : root) + url; } catch(e) { return root + url; }
    }
    return root + '/' + url.replace(/^\.\//, '');
  }

  function textOf(el, selectors) {
    for (const s of selectors) {
      const x = s === ':self' ? el : el.querySelector(s);
      const t = x && x.textContent ? x.textContent.trim() : '';
      if (t) return t.replace(/\s+/g, ' ');
    }
    return '';
  }

  function attrOf(el, selectors, attrs) {
    for (const s of selectors) {
      const x = s === ':self' ? el : el.querySelector(s);
      if (!x) continue;
      for (const a of attrs) {
        const v = x.getAttribute && x.getAttribute(a);
        if (v) return v;
      }
    }
    return '';
  }

  function posterFrom(el) {
    let p = attrOf(el, ['img', '[data-src]', '[data-original]', '[data-lazy-src]', '[src]', ':self'], ['data-src','data-original','data-lazy-src','data-thumb','poster','src']);
    if (!p) {
      const style = attrOf(el, ['[style]', ':self'], ['style']);
      const m = style && style.match(/url\(['"]?([^'")]+)['"]?\)/i);
      if (m) p = m[1];
    }
    return absUrl(p);
  }

  function cardToItem(el) {
    const href = absUrl(attrOf(el, ['a[href]', ':self'], ['href']));
    if (!href || href === baseUrl()) return null;
    let title = textOf(el, ['.aiovg-link-title','.videotitle','.mbtit','h1','h2','h3','.title','.entry-title','.post-title','a[title]','a',':self']);
    if (!title) title = attrOf(el, ['a[title]','img[alt]','img[title]'], ['title','alt']);
    title = (title || 'Untitled').replace(/\s+/g, ' ').trim();
    if (title.length > 180) title = title.slice(0, 180).trim();
    const poster = posterFrom(el);
    return new MultimediaItem({
      title,
      url: href,
      posterUrl: poster,
      type: 'movie',
      isAdult: true,
      playbackPolicy: 'Adult content'
    });
  }

  function uniqueItems(items) {
    const seen = new Set();
    return items.filter(it => {
      if (!it || !it.url || seen.has(it.url)) return false;
      seen.add(it.url); return true;
    });
  }

  function parseCards(doc) {
    const results = [];
    for (const sel of CONFIG.cardSelectors || []) {
      try {
        Array.from(doc.querySelectorAll(sel)).forEach(el => {
          const item = cardToItem(el);
          if (item) results.push(item);
        });
        if (results.length >= 12) break;
      } catch(e) {}
    }
    return uniqueItems(results).slice(0, 60);
  }

  async function getDoc(url, referer) {
    const res = await http_get(url, { ...DEFAULT_HEADERS, Referer: referer || baseUrl() + '/' });
    return { html: res.body || '', doc: await parseHtml(res.body || '') };
  }

  async function getHome(cb) {
    try {
      const data = {};
      for (const section of (CONFIG.home || [{ name:'Latest', url: baseUrl() + '/' }]).slice(0, 12)) {
        try {
          const url = absUrl(section.url, baseUrl());
          const { doc } = await getDoc(url);
          const items = parseCards(doc);
          if (items.length) data[section.name || 'Latest'] = items;
        } catch(e) {}
      }
      cb({ success: true, data });
    } catch (e) {
      cb({ success: false, errorCode: 'HOME_ERROR', message: e.message });
    }
  }

  function searchUrl(template, query) {
    const slug = encodeURIComponent(String(query || '').trim().replace(/\s+/g, '-'));
    const enc = encodeURIComponent(String(query || '').trim());
    return absUrl(template.replaceAll('{querySlug}', slug).replaceAll('{query}', enc), baseUrl());
  }

  async function search(query, cb) {
    try {
      if (!query) return cb({ success: true, data: [] });
      let out = [];
      for (const t of (CONFIG.searchTemplates || ['/?s={query}']).slice(0, 3)) {
        try {
          const { doc } = await getDoc(searchUrl(t, query));
          out = out.concat(parseCards(doc));
          if (out.length >= 20) break;
        } catch(e) {}
      }
      cb({ success: true, data: uniqueItems(out).slice(0, 60) });
    } catch(e) {
      cb({ success: false, errorCode: 'SEARCH_ERROR', message: e.message });
    }
  }

  function metaContent(doc, selector) {
    const el = doc.querySelector(selector);
    return el ? (el.getAttribute('content') || el.getAttribute('href') || el.textContent || '').trim() : '';
  }

  async function load(url, cb) {
    try {
      const { doc } = await getDoc(url);
      const title = metaContent(doc, "meta[property='og:title']") || metaContent(doc, "meta[name='twitter:title']") || textOf(doc, ['h1','.entry-title','.post-title','title']) || 'Untitled';
      const poster = absUrl(metaContent(doc, "meta[property='og:image']") || metaContent(doc, "meta[name='twitter:image']") || attrOf(doc, ['video[poster]', 'img'], ['poster','src','data-src']), url);
      const description = metaContent(doc, "meta[property='og:description']") || metaContent(doc, "meta[name='description']") || textOf(doc, ['.description','.entry-content p','.video-description']);
      const recs = parseCards(doc).filter(x => x.url !== url).slice(0, 24);
      cb({ success: true, data: new MultimediaItem({
        title, url, posterUrl: poster, description, type: 'movie', isAdult: true, recommendations: recs
      })});
    } catch(e) {
      cb({ success: false, errorCode: 'LOAD_ERROR', message: e.message });
    }
  }

  function normalizeVideoUrl(raw, origin) {
    if (!raw) return '';
    raw = String(raw)
      .replace(/\\u0026/g, '&').replace(/\\\//g, '/')
      .replace(/&amp;/g, '&').replace(/\\n/g, '')
      .trim();
    raw = raw.replace(/^['"]|['"]$/g, '');
    return absUrl(raw, origin);
  }

  function addStream(found, raw, origin, label) {
    const u = normalizeVideoUrl(raw, origin);
    if (!u) return;
    if (!/\.(mp4|m3u8|webm)(\?|#|$)/i.test(u)) return;
    found.set(u, label || 'Direct');
  }

  function addRegexStreams(html, found, origin) {
    if (!html) return;
    const patterns = [
      /https?:\\?\/\\?\/[^'"<>\s]+?\.(?:mp4|m3u8|webm)(?:\?[^'"<>\s]*)?/gi,
      /(?:file|src|url|contentUrl|embedUrl|video_url|video_alt_url|hls|downloadUrl)\s*[:=]\s*['"]([^'"]+\.(?:mp4|m3u8|webm)(?:\?[^'"]*)?)['"]/gi,
      /['"]([^'"]+\.(?:mp4|m3u8|webm)(?:\?[^'"]*)?)['"]/gi
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(html)) !== null) addStream(found, m[1] || m[0], origin, 'Direct');
    }
  }

  function decodeMaybeBase64(value) {
    try {
      if (!value || !/^data:/i.test(value)) return '';
      const idx = value.indexOf(',');
      if (idx < 0) return '';
      const payload = value.slice(idx + 1);
      if (typeof atob !== 'undefined') return atob(payload);
      return '';
    } catch(e) { return ''; }
  }

  async function collectStreams(pageUrl, html, found, depth) {
    addRegexStreams(html, found, pageUrl);
    const doc = await parseHtml(html || '');

    Array.from(doc.querySelectorAll("script[type='application/ld+json']")).forEach(s => addRegexStreams(s.textContent || '', found, pageUrl));
    Array.from(doc.querySelectorAll('script')).forEach(s => addRegexStreams(s.textContent || '', found, pageUrl));

    Array.from(doc.querySelectorAll('video[src], source[src], video[data-src], source[data-src], a[href], iframe[src], iframe[data-src], [data-video], [data-url], [data-file], [data-hls], [data-mp4]')).forEach(el => {
      ['src','data-src','href','data-video','data-url','data-file','data-hls','data-mp4'].forEach(a => {
        const v = el.getAttribute && el.getAttribute(a);
        if (v) {
          addStream(found, v, pageUrl, el.tagName === 'A' ? 'Download' : 'Direct');
          const decoded = decodeMaybeBase64(v);
          if (decoded) addRegexStreams(decoded, found, pageUrl);
        }
      });
    });

    // Common XHamster-style JSON stores and Porntrex flashvars are handled by raw regex,
    // then nested iframe pages are followed for external player hosts.
    if (depth >= 2) return;
    const frames = Array.from(doc.querySelectorAll('iframe[src], iframe[data-src]'))
      .map(el => absUrl(el.getAttribute('src') || el.getAttribute('data-src'), pageUrl))
      .filter(Boolean);
    for (const frame of frames.slice(0, 8)) {
      try {
        const r = await http_get(frame, { ...DEFAULT_HEADERS, Referer: pageUrl });
        await collectStreams(frame, r.body || '', found, depth + 1);
      } catch(e) {}
    }
  }

  async function loadStreams(url, cb) {
    try {
      const r = await http_get(url, { ...DEFAULT_HEADERS, Referer: baseUrl() + '/' });
      const found = new Map();
      await collectStreams(url, r.body || '', found, 0);
      const streams = [];
      let i = 1;
      found.forEach((label, streamUrl) => {
        const isHls = /\.m3u8(\?|#|$)/i.test(streamUrl);
        const q = (streamUrl.match(/(2160|1440|1080|720|480|360)p?/i) || [])[1];
        streams.push(new StreamResult({
          url: streamUrl,
          source: `${CONFIG.name || 'Source'} ${q ? q + 'p' : i}`,
          quality: q ? `${q}p` : undefined,
          headers: { Referer: url }
        }));
        i++;
      });
      cb({ success: true, data: streams });
    } catch(e) {
      cb({ success: false, errorCode: 'STREAM_ERROR', message: e.message });
    }
  }

  globalThis.getHome = getHome;
  globalThis.search = search;
  globalThis.load = load;
  globalThis.loadStreams = loadStreams;
})();
