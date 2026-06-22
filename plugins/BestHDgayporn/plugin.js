(() => {
  const CONFIG = {
  "internalName": "BestHDgayporn",
  "name": "BestHDgayporn",
  "packageName": "com.gayvn.besthdgayporn",
  "version": 3,
  "baseUrl": "https://besthdgayporn.com",
  "description": "BestHDgayporn is Stream and download fan content as well as scenes from your favorite studios. This site is up updated daily and is always 100% free gay porn",
  "iconUrl": "https://besthdgayporn.com/wp-content/uploads/2023/11/cropped-New-Logo-Site-110423-32x32.png",
  "authors": [
    "Gayvn"
  ],
  "languages": [
    "en"
  ],
  "categories": [
    "NSFW"
  ],
  "home": [
    {
      "name": "Latest",
      "url": "https://besthdgayporn.com/"
    },
    {
      "name": "MEN.com",
      "url": "https://besthdgayporn.com/video-tag/men-com/"
    },
    {
      "name": "Bareback",
      "url": "https://besthdgayporn.com/video-tag/bareback-gay-porn/"
    },
    {
      "name": "Onlyfans",
      "url": "https://besthdgayporn.com/video-tag/onlyfans/"
    },
    {
      "name": "Latino",
      "url": "https://besthdgayporn.com/video-tag/latino/"
    },
    {
      "name": "Voyr",
      "url": "https://besthdgayporn.com/video-tag/voyr/"
    },
    {
      "name": "Chaos Men",
      "url": "https://besthdgayporn.com/video-tag/chaos-men/"
    },
    {
      "name": "Naked Sword",
      "url": "https://besthdgayporn.com/video-tag/nakedsword/"
    }
  ],
  "cardSelectors": [
    "div.aiovg-item-video",
    ".aiovg-link-title",
    "article",
    ".video-item",
    ".video",
    ".post",
    ".entry",
    "article.loop-video",
    "article.loop-video.thumb-block",
    "ul.media-listing-grid li",
    ".media-listing-grid .media-item",
    "div.mobile-video-thumb",
    "article.elementor-post",
    "article.post",
    "div.video-item",
    ".thumb-block"
  ],
  "searchTemplates": [
    "/?s={query}"
  ],
  "sourceFile": "BestHDgayporn/src/main/kotlin/com/BestHDgayporn/BestHDgayporn.kt"
};
  const BASE = (CONFIG.baseUrl || '').replace(/\/$/, '');
  const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  function baseUrl() {
    if (typeof manifest !== 'undefined' && manifest.baseUrl) return String(manifest.baseUrl).replace(/\/$/, '');
    return BASE;
  }

  function originOf(url) {
    const m = String(url || baseUrl()).match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : baseUrl();
  }

  function absUrl(url, origin) {
    if (!url) return '';
    url = String(url).trim().replace(/&amp;/g, '&').replace(/\\\//g, '/');
    if (!url || url === '#' || /^javascript:/i.test(url) || /^mailto:/i.test(url)) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (/^https?:\/\//i.test(url)) return url;
    const root = (origin || baseUrl()).replace(/\/$/, '');
    if (url.startsWith('/')) return originOf(root) + url;
    let base = root;
    if (!base.endsWith('/')) base += '/';
    return base + url.replace(/^\.\//, '');
  }

  function getAttr(el, names) {
    if (!el || !el.getAttribute) return '';
    for (const n of names) {
      const v = el.getAttribute(n);
      if (v) return v;
    }
    return '';
  }

  function textOf(el, selectors) {
    for (const s of selectors) {
      const x = s === ':self' ? el : (el.querySelector ? el.querySelector(s) : null);
      const t = x && x.textContent ? x.textContent.trim().replace(/\s+/g, ' ') : '';
      if (t) return t;
    }
    return '';
  }

  function posterFrom(el, origin) {
    let img = el.querySelector ? el.querySelector('img, [data-src], [data-original], [data-lazy-src], [data-thumb], [poster]') : null;
    let p = getAttr(img || el, ['data-src','data-original','data-lazy-src','data-thumb','data-poster','poster','src']);
    if (!p) {
      const srcset = getAttr(img || el, ['srcset','data-srcset']);
      if (srcset) p = srcset.split(',').pop().trim().split(/\s+/)[0];
    }
    if (!p) {
      const style = getAttr(el.querySelector ? (el.querySelector('[style]') || el) : el, ['style']);
      const m = style && style.match(/url\(['"]?([^'")]+)['"]?\)/i);
      if (m) p = m[1];
    }
    return absUrl(p, origin);
  }

  function isProbablyVideoUrl(href) {
    if (!href) return false;
    const u = href.toLowerCase();
    if (u === baseUrl().toLowerCase() || u === baseUrl().toLowerCase() + '/') return false;
    if (/(\/tag\/|\/tags\/|\/category\/|\/categories\/|\/studio\/|\/channels?\/|\/creators?\/|\/pornstars?\/|\/login|\/register|\/upload|\/search|\/page\/\d+|\?s=|\?filter|\/privacy|\/sitemap)/i.test(u)) return false;
    if (/(twitter\.com|x\.com|facebook\.com|telegram|mailto:)/i.test(u)) return false;
    return /\/video|\/videos|\/watch|\/embed|\/gay|\/[0-9]{3,}|\.html$|\/[a-z0-9-]{10,}\/?$/i.test(u);
  }

  function cardToItem(el, origin) {
    const a = el.querySelector ? (el.querySelector('a[href]') || (el.matches && el.matches('a[href]') ? el : null)) : null;
    const href = absUrl(getAttr(a, ['href']), origin || baseUrl());
    if (!isProbablyVideoUrl(href)) return null;
    let title = textOf(el, ['.aiovg-link-title','.videotitle','.mbtit','.title','.entry-title','.post-title','h1','h2','h3','a[title]','a',':self']);
    if (!title) title = getAttr(a, ['title']) || getAttr(el.querySelector ? el.querySelector('img[alt],img[title]') : null, ['alt','title']);
    title = (title || 'Untitled').replace(/\s+/g, ' ').trim();
    if (title.length > 160) title = title.slice(0, 160).trim();
    const poster = posterFrom(el, origin || href);
    // Avoid blank blue cards where possible: item remains playable but image-less entries are deprioritized in parseCards.
    return new MultimediaItem({ title, url: href, posterUrl: poster, type: 'movie', isAdult: true, contentRating: '18+' });
  }

  function uniqueItems(items) {
    const seen = new Set();
    return items.filter(it => {
      if (!it || !it.url || seen.has(it.url)) return false;
      seen.add(it.url); return true;
    });
  }

  function parseCards(doc, origin) {
    let results = [];
    for (const sel of CONFIG.cardSelectors || []) {
      try {
        const chunk = Array.from(doc.querySelectorAll(sel)).map(el => cardToItem(el, origin)).filter(Boolean);
        if (chunk.length) results = results.concat(chunk);
        if (results.length >= 20) break;
      } catch(e) {}
    }
    // Strong fallback: anchors that wrap images/posters only; avoids nav/category links.
    if (results.length < 8) {
      try {
        Array.from(doc.querySelectorAll('a[href]')).forEach(a => {
          if (!a.querySelector('img,[style],[data-src],[data-thumb]')) return;
          const item = cardToItem(a.parentElement || a, origin);
          if (item) results.push(item);
        });
      } catch(e) {}
    }
    const uniq = uniqueItems(results);
    // Prefer entries with posters, then fill with remaining playable items.
    const withPoster = uniq.filter(x => x.posterUrl);
    const noPoster = uniq.filter(x => !x.posterUrl);
    return withPoster.concat(noPoster).slice(0, 60);
  }

  async function getHtml(url, referer) {
    const res = await http_get(url, { ...DEFAULT_HEADERS, Referer: referer || baseUrl() + '/' });
    return res.body || '';
  }

  async function getDoc(url, referer) {
    const html = await getHtml(url, referer);
    return { html, doc: await parseHtml(html) };
  }

  async function getHome(cb) {
    try {
      const data = {};
      const sections = (CONFIG.home && CONFIG.home.length ? CONFIG.home : [{ name:'Latest', url: baseUrl() + '/' }]).slice(0, 12);
      for (const section of sections) {
        try {
          const url = absUrl(section.url, baseUrl());
          const { doc } = await getDoc(url, baseUrl() + '/');
          const items = parseCards(doc, url);
          if (items.length) data[section.name || 'Latest'] = items;
        } catch(e) {}
      }
      cb({ success: true, data });
    } catch (e) {
      cb({ success: false, errorCode: 'HOME_ERROR', message: e.message });
    }
  }

  function searchUrl(template, query) {
    const raw = String(query || '').trim();
    const slug = encodeURIComponent(raw.replace(/\s+/g, '-'));
    const enc = encodeURIComponent(raw);
    return absUrl(template.replaceAll('{querySlug}', slug).replaceAll('{query}', enc), baseUrl());
  }

  async function search(query, cb) {
    try {
      if (!query) return cb({ success: true, data: [] });
      let out = [];
      for (const t of (CONFIG.searchTemplates || ['/?s={query}']).slice(0, 3)) {
        try {
          const url = searchUrl(t, query);
          const { doc } = await getDoc(url, baseUrl() + '/');
          out = out.concat(parseCards(doc, url));
          if (out.length >= 25) break;
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
      const { doc } = await getDoc(url, baseUrl() + '/');
      const title = metaContent(doc, "meta[property='og:title']") || metaContent(doc, "meta[name='twitter:title']") || textOf(doc, ['h1','.entry-title','.post-title','title']) || 'Untitled';
      const poster = absUrl(metaContent(doc, "meta[property='og:image']") || metaContent(doc, "meta[name='twitter:image']") || getAttr(doc.querySelector('video[poster],img'), ['poster','src','data-src']), url);
      const description = metaContent(doc, "meta[property='og:description']") || metaContent(doc, "meta[name='description']") || textOf(doc, ['.description','.entry-content p','.video-description']);
      const recs = parseCards(doc, url).filter(x => x.url !== url).slice(0, 24);
      cb({ success: true, data: new MultimediaItem({ title, url, posterUrl: poster, description, type: 'movie', isAdult: true, contentRating: '18+', recommendations: recs }) });
    } catch(e) {
      cb({ success: false, errorCode: 'LOAD_ERROR', message: e.message });
    }
  }

  function normalizeVideoUrl(raw, origin) {
    if (!raw) return '';
    raw = String(raw).replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/\\n/g, '').trim();
    raw = raw.replace(/^['"]|['"]$/g, '');
    return absUrl(raw, origin);
  }

  function addStream(found, raw, origin, label, headers) {
    const u = normalizeVideoUrl(raw, origin);
    if (!u) return;
    if (!/\.(mp4|m3u8|webm)(\?|#|$)/i.test(u)) return;
    found.set(u, { label: label || 'Direct', headers: headers || { Referer: origin || baseUrl() + '/' } });
  }

  function addRegexStreams(html, found, origin) {
    if (!html) return;
    const h = String(html).replace(/\\\//g, '/').replace(/&amp;/g, '&');
    const patterns = [
      /https?:\/?\/?[^'"<>\s]+?\.(?:mp4|m3u8|webm)(?:\?[^'"<>\s]*)?/gi,
      /(?:file|src|url|contentUrl|embedUrl|video_url|video_alt_url|hls|downloadUrl|html5video|media_url)\s*[:=]\s*['"]([^'"]+\.(?:mp4|m3u8|webm)(?:\?[^'"]*)?)['"]/gi,
      /['"]([^'"]+\.(?:mp4|m3u8|webm)(?:\?[^'"]*)?)['"]/gi
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(h)) !== null) addStream(found, m[1] || m[0], origin, 'Direct');
    }
  }

  function parseJsonLoose(text) {
    try { return JSON.parse(text); } catch(e) {}
    try { return JSON.parse(text.replace(/\\\//g, '/').replace(/,\s*]/g, ']').replace(/,\s*}/g, '}')); } catch(e) {}
    return null;
  }

  function walkJson(obj, found, origin) {
    if (!obj) return;
    if (typeof obj === 'string') { addRegexStreams(obj, found, origin); return; }
    if (Array.isArray(obj)) { obj.forEach(x => walkJson(x, found, origin)); return; }
    if (typeof obj !== 'object') return;
    for (const [k,v] of Object.entries(obj)) {
      if (typeof v === 'string' && /url|src|file|hls|mp4|video|content/i.test(k)) addStream(found, v, origin, k);
      walkJson(v, found, origin);
    }
  }

  function parseBoyfriendSources(html, found, origin) {
    const m = String(html).match(/var\s+sources\s*=\s*(\[[\s\S]*?\]);/i);
    if (!m) return;
    const arr = parseJsonLoose(m[1]);
    if (!arr) return;
    arr.forEach(s => addStream(found, s.src || s.file || s.url, origin, s.desc || s.label || 'BoyfriendTV', { Referer: 'https://www.boyfriendtv.com/', Origin: 'https://www.boyfriendtv.com' }));
  }

  function base36(hex) {
    try {
      if (!hex || hex.length < 32) return '';
      const parts = [hex.slice(0,8),hex.slice(8,16),hex.slice(16,24),hex.slice(24,32)];
      const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
      function conv(h) {
        let n = BigInt('0x' + h); if (n === 0n) return '0';
        let out = ''; while (n > 0n) { out = chars[Number(n % 36n)] + out; n = n / 36n; } return out;
      }
      return parts.map(conv).join('');
    } catch(e) { return ''; }
  }

  async function parseEporner(html, found, origin) {
    const vid = (String(html).match(/EP\.video\.player\.vid\s*=\s*['"]([^'"]+)/i) || [])[1];
    const hash = (String(html).match(/EP\.video\.player\.hash\s*=\s*['"]([^'"]+)/i) || [])[1];
    if (!vid || !hash) return;
    const h = base36(hash); if (!h) return;
    try {
      const json = await getHtml(`https://www.eporner.com/xhr/video/${vid}?hash=${h}`, origin);
      walkJson(parseJsonLoose(json), found, origin);
    } catch(e) {}
  }

  function unpackPacker(source) {
    // Conservative support for Dean Edwards p,a,c,k,e,d packed snippets; if anything fails, return empty.
    try {
      const m = String(source).match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\}\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
      if (!m) return '';
      let payload = m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      const radix = parseInt(m[2],10); const count = parseInt(m[3],10); const symtab = m[4].split('|');
      function unbase(str) { return parseInt(str, radix); }
      for (let i=count-1; i>=0; i--) {
        const word = symtab[i]; if (!word) continue;
        payload = payload.replace(new RegExp('\\b' + i.toString(radix) + '\\b','g'), word);
      }
      return payload;
    } catch(e) { return ''; }
  }

  async function collectStreams(pageUrl, html, found, depth) {
    addRegexStreams(html, found, pageUrl);
    parseBoyfriendSources(html, found, pageUrl);
    await parseEporner(html, found, pageUrl);
    const unpacked = unpackPacker(html); if (unpacked) addRegexStreams(unpacked, found, pageUrl);

    const doc = await parseHtml(html || '');
    Array.from(doc.querySelectorAll("script[type='application/ld+json']")).forEach(s => { walkJson(parseJsonLoose(s.textContent || s.innerHTML || ''), found, pageUrl); addRegexStreams(s.textContent || '', found, pageUrl); });
    Array.from(doc.querySelectorAll('script')).forEach(s => {
      const code = s.textContent || '';
      addRegexStreams(code, found, pageUrl);
      walkJson(parseJsonLoose((code.match(/\{[\s\S]*\}/)||[])[0]), found, pageUrl);
      const unpackedCode = unpackPacker(code); if (unpackedCode) addRegexStreams(unpackedCode, found, pageUrl);
    });

    Array.from(doc.querySelectorAll('video[src], source[src], video[data-src], source[data-src], a[href], iframe[src], iframe[data-src], [data-video], [data-url], [data-file], [data-hls], [data-mp4], [data-full], [data-link]')).forEach(el => {
      ['src','data-src','href','data-video','data-url','data-file','data-hls','data-mp4','data-full','data-link'].forEach(a => {
        const v = el.getAttribute && el.getAttribute(a);
        if (v) addStream(found, v, pageUrl, el.tagName === 'A' ? 'Download' : 'Direct');
      });
    });

    if (depth >= 2) return;
    const frames = Array.from(doc.querySelectorAll('iframe[src], iframe[data-src], [data-embed], [data-player]'))
      .map(el => absUrl(el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-embed') || el.getAttribute('data-player'), pageUrl))
      .filter(Boolean)
      .filter(u => !/doubleclick|google|ads|exoclick|juicyads|traffic|banner/i.test(u));
    for (const frame of frames.slice(0, 10)) {
      try {
        const frameHtml = await getHtml(frame, pageUrl);
        await collectStreams(frame, frameHtml, found, depth + 1);
      } catch(e) {}
    }
  }

  async function loadStreams(url, cb) {
    try {
      const html = await getHtml(url, baseUrl() + '/');
      const found = new Map();
      await collectStreams(url, html || '', found, 0);
      const streams = [];
      let i = 1;
      found.forEach((info, streamUrl) => {
        const q = (streamUrl.match(/(2160|1440|1080|720|480|360)p?/i) || [])[1];
        streams.push(new StreamResult({
          url: streamUrl,
          source: `${CONFIG.name || 'Source'} ${q ? q + 'p' : i}`,
          quality: q ? `${q}p` : undefined,
          headers: info.headers || { Referer: url }
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
