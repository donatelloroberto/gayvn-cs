package com.Nurgay

import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.LoadResponse.Companion.addActors
import com.lagradost.cloudstream3.utils.*
import com.lagradost.cloudstream3.app
import com.lagradost.cloudstream3.extractors.*
import org.jsoup.nodes.Element
import java.io.IOException
import com.lagradost.api.Log


class Nurgay : MainAPI() {
    override var mainUrl = "https://nurgay.to"
    override var name = "Nurgay"
    override val hasMainPage = true
    override var lang = "en"
    override val hasQuickSearch = false
    override val hasChromecastSupport = true
    override val hasDownloadSupport = true
    override val supportedTypes = setOf(TvType.NSFW)
    override val vpnStatus = VPNStatus.MightBeNeeded


    override val mainPage = mainPageOf(
        "/?filter=latest"                         to "Latest",
        "/?filter=most-viewed"                    to "Most Viewed",
        "/asiaten"                                to "Asian",
        "/bären"                                  to "Bears",
        "/bareback"                               to "Bareback",
        "/bisex"                                  to "Bisexual",
        "/blasen"                                 to "Blowjob",
        "/cumshots"                               to "Cumshot",
        "/gruppensex"                             to "Group Sex",
        "/hardcore"                               to "Hardcore",
        "/hunks"                                  to "Hunks",
        "/latino"                                 to "Latino",
        "/muskeln"                                to "Muscle",
        "/outdoor"                                to "Outdoor",
        "/twinks"                                 to "Twinks",
        "/vintage"                                to "Vintage",
    )    

    override suspend fun getMainPage(page: Int, request: MainPageRequest): HomePageResponse {
    val pageUrl = if (page == 1) {
        "$mainUrl${request.data}"
    } else if (request.data.contains("?")) {
        "$mainUrl/page/$page${request.data}"
    } else {
        "$mainUrl${request.data}/page/$page"
    }

    val document = app.get(pageUrl).document
    val home = document.select("article.loop-video").mapNotNull { it.toSearchResult() }

    return newHomePageResponse(
        list = HomePageList(
            name = request.name,
            list = home,
            isHorizontalImages = false
        ),
        hasNext = true
    )
}

private fun Element.toSearchResult(): SearchResponse {
    val title = this.select("header.entry-header span").text() // ✅ Sửa lấy text
    val href = fixUrl(this.select("a").attr("href"))
    val posterUrl = fixUrlNull(this.select("img").attr("data-src"))
    
    return newMovieSearchResponse(title, href, TvType.NSFW) {
        this.posterUrl = posterUrl
    }
}

override suspend fun search(query: String): List<SearchResponse> {
    val searchResponse = mutableListOf<SearchResponse>()

    for (i in 1..7) {
        // ✅ Sửa URL search: thêm `&page=i`
        val document = app.get("$mainUrl/?s=$query&page=$i").document
        val results = document.select("article.loop-video").mapNotNull { it.toSearchResult() }

        if (results.isEmpty()) break
        searchResponse.addAll(results)
    }

    return searchResponse
}
   

    override suspend fun load(url: String): LoadResponse {
        val document = app.get(url).document

        val title = document.selectFirst("meta[property=og:title]")?.attr("content")?.trim() ?: ""
        val poster = document.selectFirst("meta[property=og:image]")?.attr("content")?.trim()
            ?: document.selectFirst("video[poster]")?.attr("abs:poster")
        val description = document.selectFirst("meta[property=og:description]")?.attr("content")?.trim()

        val tags = document.select(
            "a[rel='tag'], .entry-tags a, .post-tags a, .tags a, a.tag, .video-tags a"
        ).map { it.text().trim() }.filter { it.isNotBlank() }.distinct()

        val actors = document.select(
            ".models a, .performers a, a.model, .cast a, .pornstars a, div.actors a"
        ).map { it.text().trim() }.filter { it.isNotBlank() }.distinct()

        val recommendations = document.select("article.loop-video").mapNotNull { it.toSearchResult() }

        return newMovieLoadResponse(title, url, TvType.NSFW, url) {
            this.posterUrl = poster
            this.plot = description
            if (tags.isNotEmpty()) this.tags = tags
            if (actors.isNotEmpty()) addActors(actors)
            this.recommendations = recommendations
        }
    }

override suspend fun loadLinks(
    data: String,
    isCasting: Boolean,
    subtitleCallback: (SubtitleFile) -> Unit,
    callback: (ExtractorLink) -> Unit
): Boolean {
    val document = app.get(data).document
    var found = false

    val mirrors = document.select("ul#mirrorMenu a.mirror-opt, a.dropdown-item.mirror-opt")
        .mapNotNull { it.attr("data-url").takeIf { u -> u.isNotBlank() && u != "#" } }
        .toMutableSet()

    if (mirrors.isEmpty()) {
        val iframeSrc = document.selectFirst("iframe[src]")?.attr("src")
        iframeSrc?.let { mirrors.add(it) }
    }

    mirrors.toList().amap { url ->
        val ok = loadExtractor(url, referer = data, subtitleCallback = subtitleCallback) { link -> callback(link) }
        if (ok) found = true
    }

    val subRegex = Regex("""https?://[^\s'"<>]+?\.(?:vtt|srt)(\?[^'"\s<>]*)?""", RegexOption.IGNORE_CASE)
    document.select("track[src]").forEach { track ->
        val src = track.attr("abs:src").ifEmpty { track.attr("src") }
        if (src.isNotBlank()) {
            val lang = when (track.attr("srclang").lowercase()) {
                "en" -> "English"; "es" -> "Spanish"; "pt" -> "Portuguese"
                "de" -> "German"; "fr" -> "French"
                else -> track.attr("label").ifEmpty { "English" }
            }
            subtitleCallback.invoke(SubtitleFile(lang, src))
        }
    }
    subRegex.findAll(document.html()).map { it.value }.distinct().forEach { subUrl ->
        val lang = when {
            subUrl.contains("_en", ignoreCase = true) || subUrl.contains("/en/", ignoreCase = true) -> "English"
            subUrl.contains("_es", ignoreCase = true) || subUrl.contains("/es/", ignoreCase = true) -> "Spanish"
            subUrl.contains("_pt", ignoreCase = true) || subUrl.contains("/pt/", ignoreCase = true) -> "Portuguese"
            subUrl.contains("_de", ignoreCase = true) || subUrl.contains("/de/", ignoreCase = true) -> "German"
            else -> "English"
        }
        subtitleCallback.invoke(SubtitleFile(lang, subUrl))
    }

    return found
}
}