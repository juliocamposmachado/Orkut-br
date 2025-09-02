"use client"

import Image from "next/image"
import React, { useMemo } from "react"
import { cn } from "@/lib/utils"

interface PhotoCardProps {
  id: string
  src: string
  title?: string
  className?: string
}

// Util: gera uma versão mini para blur usando os parâmetros do Pexels/Imaging (?w=)
const toLowRes = (url: string): string => {
  try {
    const u = new URL(url)
    // se já houver w=, força um valor bem pequeno
    const params = u.searchParams
    params.set("w", "24")
    u.search = params.toString()
    return u.toString()
  } catch {
    return url
  }
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ id, src, title, className }) => {
  const blurSrc = useMemo(() => toLowRes(src), [src])

  return (
    <figure className={cn("relative overflow-hidden rounded-lg bg-gray-100", className)}>
      <Image
        src={src}
        alt={title || id}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
        // next/image serve AVIF/WebP automaticamente quando disponível
        placeholder="blur"
        blurDataURL={blurSrc}
        className="object-cover transition-transform duration-300 hover:scale-[1.03]"
        priority={false}
      />
      {title && (
        <figcaption className="absolute bottom-0 left-0 right-0 bg-black/35 text-white text-xs px-2 py-1 line-clamp-1">
          {title}
        </figcaption>
      )}
    </figure>
  )
}

