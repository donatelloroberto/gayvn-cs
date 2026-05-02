package com.GayStream

import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.LoadResponse.Companion.addActors
import com.lagradost.cloudstream3.utils.*
import com.lagradost.cloudstream3.app
import com.lagradost.cloudstream3.extractors.*
import org.jsoup.nodes.Element
import java.io.IOException
import com.lagradost.api.Log


class GayStream : MainAPI() {
    override var mainUrl = "https://gaystream.pw"
    override var name = "GayStream"
    override val hasMainPage = true
    override var lang = "en"
    override val hasQuickSearch = false
    override val hasChromecastSupport = true
    override val hasDownloadSupport = true
    override val supportedTypes = setOf(TvType.NSFW)
    override val vpnStatus = VPNStatus.MightBeNeeded


    override val mainPage = mainPageOf(
        ""                                      to "Latest",
        "/video/category/4k"                    to "4K",
        "/video/category/anal"                  to "Anal",
        "/video/category/asian"                 to "Asian",
        "/video/category/bareback"              to "Bareback",
        "/video/category/bears"                 to "Bears",
        "/video/category/blowjob"               to "Blowjob",
        "/video/category/cumshot"               to "Cumshot",
        "/video/category/dp"                    to "DP",
        "/video/category/group"                 to "Group",
        "/video/category/homemade"              to "Homemade",
        "/video/category/hunk"                  to "Hunk",
        "/video/category/interracial"           to "Interracial",
        "/video/category/latino"                to "Latino",
        "/video/category/massage"               to "Massage",
        "/video/category/mature"                to "Mature",
        "/video/category/muscle"                to "Muscle",
        "/video/category/orgy"                  to "Orgy",
        "/video/category/outdoor"               to "Outdoor",
        "/video/category/promotion"             to "Promotion",
        "/video/category/solo"                  to "Solo",
        "/video/category/threesome"             to "Threesome",
        "/video/category/twink"                 to "Twink",
        "/video/category/uniforms"              to "Uniforms",
        "/video/channel/betabetapi"             to "Beta Beta Pi",
        "/video/channel/caninolatino"           to "Canino Latino",
    )    

    override suspend fun getMainPage(page: Int, request: MainPageRequest): HomePageResponse {
        /**
         * Build the page URL correctly.  The previous implementation used braces and an extra
         * trailing `$` which resulted in malformed strings like `$mainUrl{request.data}/page/2$`.
         * Here we interpolate `request.data` properly and only append the pagination suffix when
         * needed.  `request.data` always starts with either a `/` or a `?`, so concatenation is
         * safe without inserting an additional slash in front of it.
         */
        val pageUrl = if (page == 1) {
            "$mainUrl${request.data}"
        } else {
            // Append the page number between the path/query and avoid trailing `$`
            "$mainUrl${request.data}/page/$page"
        }

        val document = app.get(pageUrl).document
        val home = document.select("div.grid-item").mapNotNull { it.toSearchResult() }

        return newHomePageResponse(
            list = HomePageList(
                name = request.name,
                list = home,
                isHorizontalImages = true
            ),
            // Always indicate there may be more pages; actual next/prev detection is not supported
            hasNext = true
        )
    }

private fun Element.toSearchResult(): SearchResponse {
    val title = this.select("h3.item-title").text()
    val href = fixUrl(this.select("a.item-wrap").attr("href"))
    val img = this.selectFirst("img.item-img")
    val posterUrl = fixUrlNull(
        img?.attr("data-src")?.ifEmpty { null } ?: img?.attr("data-lazy-src")?.ifEmpty { null } ?: img?.attr("src")
    )
    return newMovieSearchResponse(title, href, TvType.NSFW) {
        this.posterUrl = posterUrl
    }
}

override suspend fun search(query: String): List<SearchResponse> {
    val searchResponse = mutableListOf<SearchResponse>()

    for (i in 1..7) {
        // ✅ Sửa URL search: thêm `&page=i`
        val document = app.get("$mainUrl/?s=$query&page=$i").document
        val results = document.select("div.grid-item").mapNotNull { it.toSearchResult() }

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
            "div.video-tags a, .tags a, a.tag, a[rel='tag'], .video-categories a, .item-tags a"
        ).map { it.text().trim() }.filter { it.isNotBlank() }.distinct()

        val actors = document.select(
            "div.actors a, .pornstars a, .models a, a.model-link, div.performer a, .video-actors a"
        ).map { it.text().trim() }.filter { it.isNotBlank() }.distinct()

        val recommendations = document.select("div.grid-item").mapNotNull { it.toSearchResult() }

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

    // Lấy URL từ các button trong tabs-wrap
    val videoUrls = document.select("div.tabs-wrap button[onclick]")
        .mapNotNull { it.attr("onclick").takeIf { u -> u.isNotBlank() && u != "#" } }
        .mapNotNull { onclick ->
            // Tách URL từ onclick="document.getElementById('ifr').src='URL'"
            Regex("src=(?:&quot;|\"|')(.*?)(?:&quot;|\"|')").find(onclick)?.groupValues?.get(1)
        }
        .toMutableSet()

    // Fallback iframe (trường hợp không có button)
    if (videoUrls.isEmpty()) {
        val iframeSrc = document.selectFirst("iframe#ifr")?.attr("src")
        iframeSrc?.let { videoUrls.add(it) }
    }

    // Thu thập URL từ nút download
    val button = document.selectFirst("a.video-download[href]")?.attr("href")
    button?.let { videoUrls.add(it) }

    // Xử lý tất cả URL đã thu thập
    videoUrls.toList().amap { url ->
        val ok = loadExtractor(
            url,
            referer = data,
            subtitleCallback = subtitleCallback
        ) { link -> callback(link) }
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