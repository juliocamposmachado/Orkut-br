import { NextResponse } from 'next/server'
import { load } from 'cheerio'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Validate URL format
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }

    // Fetch the page with timeout and proper headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow'
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = load(html)

    // Extract metadata with fallbacks
    const getMetaContent = (selector: string): string | null => {
      return $(selector).attr('content') || null
    }

    // Try different meta tag variations
    const title = getMetaContent('meta[property="og:title"]') ||
                  getMetaContent('meta[name="twitter:title"]') ||
                  $('title').text() ||
                  'Link'

    const description = getMetaContent('meta[property="og:description"]') ||
                       getMetaContent('meta[name="twitter:description"]') ||
                       getMetaContent('meta[name="description"]') ||
                       ''

    const image = getMetaContent('meta[property="og:image"]') ||
                  getMetaContent('meta[name="twitter:image"]') ||
                  getMetaContent('meta[name="twitter:image:src"]') ||
                  null

    // Get site name
    const siteName = getMetaContent('meta[property="og:site_name"]') ||
                     urlObj.hostname.replace('www.', '') ||
                     'Website'

    // Get favicon
    const favicon = $('link[rel="icon"]').attr('href') ||
                   $('link[rel="shortcut icon"]').attr('href') ||
                   $('link[rel="apple-touch-icon"]').attr('href') ||
                   `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`

    // Resolve relative URLs
    const resolveUrl = (relativeUrl: string | null): string | null => {
      if (!relativeUrl) return null
      try {
        return new URL(relativeUrl, url).href
      } catch {
        return null
      }
    }

    const metadata = {
      url,
      title: title.trim().substring(0, 100), // Limit title length
      description: description.trim().substring(0, 200), // Limit description length
      image: resolveUrl(image),
      siteName: siteName.trim().substring(0, 50), // Limit site name length
      favicon: resolveUrl(favicon),
      domain: urlObj.hostname
    }

    return NextResponse.json(metadata)

  } catch (error: any) {
    console.error('Link preview error:', error)
    
    // Return basic metadata even if parsing fails
    try {
      const urlObj = new URL(url)
      return NextResponse.json({
        url,
        title: urlObj.hostname.replace('www.', ''),
        description: '',
        image: null,
        siteName: urlObj.hostname.replace('www.', ''),
        favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        domain: urlObj.hostname,
        error: 'Could not fetch full metadata'
      })
    } catch {
      return NextResponse.json({ 
        error: 'Invalid URL or unable to fetch metadata' 
      }, { status: 400 })
    }
  }
}
