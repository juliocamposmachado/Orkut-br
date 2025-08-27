'use client'

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://orkut-br-oficial.vercel.app/#website",
        "url": "https://orkut-br-oficial.vercel.app",
        "name": "Orkut BR - Full-Stack Social Network Platform",
        "description": "Modern social network platform built with Next.js, React, TypeScript, Supabase, and WebRTC. Demonstrates advanced full-stack development skills and modern web technologies.",
        "publisher": {
          "@id": "https://orkut-br-oficial.vercel.app/#organization"
        },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://orkut-br-oficial.vercel.app/buscar?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        ],
        "inLanguage": "pt-BR"
      },
      {
        "@type": "Organization",
        "@id": "https://orkut-br-oficial.vercel.app/#organization",
        "name": "Like Look Solutions",
        "url": "https://likelook.wixsite.com/solutions",
        "logo": {
          "@type": "ImageObject",
          "inLanguage": "pt-BR",
          "url": "https://orkut-br-oficial.vercel.app/favicon.svg",
          "contentUrl": "https://orkut-br-oficial.vercel.app/favicon.svg",
          "width": 32,
          "height": 32,
          "caption": "Like Look Solutions"
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+5511992946628",
            "contactType": "technical support",
            "areaServed": "BR",
            "availableLanguage": "Portuguese"
          }
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Rua Dante Pellacani, 92",
          "addressLocality": "São Paulo",
          "addressRegion": "SP",
          "addressCountry": "BR"
        },
        "founder": {
          "@type": "Person",
          "name": "Julio Campos Machado",
          "jobTitle": "Full-Stack Developer & Technical Lead",
          "email": "juliocamposmachado@gmail.com",
          "telephone": "+5511992946628",
          "knowsAbout": [
            "Next.js Development",
            "React Development",
            "TypeScript",
            "Supabase",
            "WebRTC Implementation",
            "Full-Stack Architecture"
          ]
        }
      },
      {
        "@type": "WebApplication",
        "name": "Orkut BR - Full-Stack Social Network",
        "url": "https://orkut-br-oficial.vercel.app",
        "description": "Full-stack social network platform demonstrating modern web development with Next.js, React, TypeScript, Supabase, and WebRTC technologies.",
        "applicationCategory": "SocialNetworkingApplication",
        "operatingSystem": "Web Browser",
        "browserRequirements": "Modern web browser with ES6+ JavaScript support, WebRTC capabilities",
        "permissions": "microphone and camera (optional for voice/video calls)",
        "author": {
          "@type": "Person",
          "name": "Julio Campos Machado",
          "url": "https://likelook.wixsite.com/solutions"
        },
        "provider": {
          "@id": "https://orkut-br-oficial.vercel.app/#organization"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "Next.js 13 App Router",
          "React 18 Server Components",
          "TypeScript Implementation",
          "Supabase Real-time Database",
          "WebRTC Video/Audio Calls",
          "OAuth Authentication (Google)",
          "Responsive Design",
          "Real-time Messaging",
          "User Profile Management",
          "Community System"
        ],
        "programmingLanguage": [
          "TypeScript",
          "JavaScript",
          "SQL"
        ],
        "runtime": "Node.js",
        "codeRepository": "https://github.com/juliocamposmachado"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Orkut BR - Development Portfolio",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web",
        "url": "https://orkut-br-oficial.vercel.app",
        "author": {
          "@type": "Person",
          "name": "Julio Campos Machado",
          "jobTitle": "Full-Stack Developer"
        },
        "datePublished": "2025-08-27",
        "description": "Advanced full-stack web application showcasing modern development practices, including Next.js, React, TypeScript, Supabase, WebRTC, and responsive design patterns.",
        "screenshot": "https://orkut-br-oficial.vercel.app/Orkutredes.png",
        "softwareVersion": "1.0.0",
        "programmingLanguage": "TypeScript",
        "runtimePlatform": "Node.js",
        "targetProduct": "Web Browsers",
        "applicationSubCategory": "Portfolio Project",
        "featureList": [
          "Modern React Architecture",
          "TypeScript Implementation",
          "Real-time Database Integration",
          "WebRTC Implementation",
          "Authentication System",
          "Responsive UI/UX Design"
        ]
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  )
}
