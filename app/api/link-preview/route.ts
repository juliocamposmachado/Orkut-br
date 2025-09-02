import { NextResponse } from 'next/server'

// Helper function to extract content from meta tags using regex
function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta\s+property=["']${property}["']\s+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta\s+content=["']([^"']+)["']\s+property=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta\s+name=["']${property}["']\s+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta\s+content=["']([^"']+)["']\s+name=["']${property}["'][^>]*>`, 'i')
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

// Helper function to extract title from HTML
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1].trim() : 'Link'
}

// Helper function to extract favicon URL
function extractFavicon(html: string): string | null {
  const patterns = [
    /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["'][^>]*>/i,
    /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']shortcut icon["'][^>]*>/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

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

    // Extract metadata using regex patterns
    const ogTitle = extractMetaContent(html, 'og:title')
    const twitterTitle = extractMetaContent(html, 'twitter:title')
    const htmlTitle = extractTitle(html)
    const title = ogTitle || twitterTitle || htmlTitle || 'Link'

    const ogDescription = extractMetaContent(html, 'og:description')
    const twitterDescription = extractMetaContent(html, 'twitter:description')
    const metaDescription = extractMetaContent(html, 'description')
    const description = ogDescription || twitterDescription || metaDescription || ''

    const ogImage = extractMetaContent(html, 'og:image')
    const twitterImage = extractMetaContent(html, 'twitter:image')
    const twitterImageSrc = extractMetaContent(html, 'twitter:image:src')
    const image = ogImage || twitterImage || twitterImageSrc

    const ogSiteName = extractMetaContent(html, 'og:site_name')
    const siteName = ogSiteName || urlObj.hostname.replace('www.', '') || 'Website'

    const favicon = extractFavicon(html)

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
      title: title.substring(0, 100), // Limit title length
      description: description.substring(0, 200), // Limit description length
      image: resolveUrl(image),
      siteName: siteName.substring(0, 50), // Limit site name length
      favicon: resolveUrl(favicon) || `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
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
