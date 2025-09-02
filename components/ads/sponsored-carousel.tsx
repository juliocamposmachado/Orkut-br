'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

interface Ad {
  id: number
  title: string
  description: string
  image: string
  link: string
  brand: string
}

const ads: Ad[] = [
  {
    id: 1,
    title: "Super Nostalgia Gaming",
    description: "Reviva os clássicos dos anos 2000! Mais de 500 jogos retrô.",
    image: "https://i.gifer.com/C0HP.gif",
    link: "#",
    brand: "RetroGames"
  },
  {
    id: 2,
    title: "Orkut Premium",
    description: "Desbloqueie recursos exclusivos e personalize seu perfil!",
    image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300&h=200",
    link: "#",
    brand: "Orkut"
  },
  {
    id: 3,
    title: "Nostalgia Store",
    description: "Produtos dos anos 2000: CDs, DVDs e muito mais!",
    image: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=300&h=200",
    link: "#",
    brand: "NostalgiaShop"
  },
  {
    id: 4,
    title: "Conecte-se com Amigos",
    description: "Reencontre seus amigos da escola com nossa IA avançada!",
    image: "https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=300&h=200",
    link: "#",
    brand: "FriendFinder"
  },
  {
    id: 5,
    title: "Músicas dos Anos 2000",
    description: "Playlist completa da era dourada! Ouça grátis.",
    image: "https://images.pexels.com/photos/210895/pexels-photo-210895.jpeg?auto=compress&cs=tinysrgb&w=300&h=200",
    link: "#",
    brand: "RetroMusic"
  }
]

export function SponsoredCarousel() {
  const [currentAd, setCurrentAd] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length)
    }, 5000) // Muda a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  const nextAd = () => {
    setCurrentAd((prev) => (prev + 1) % ads.length)
  }

  const prevAd = () => {
    setCurrentAd((prev) => (prev - 1 + ads.length) % ads.length)
  }

  const currentAdData = ads[currentAd]

  return (
    <div className="relative">
      {/* Ad Content */}
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentAd * 100}%)` }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className="w-full flex-shrink-0">
              <div className="relative">
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {ad.title}
                  </h3>
                  <p className="text-white/90 text-xs mb-2">
                    {ad.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-xs">
                      Por {ad.brand}
                    </span>
                    <Button
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-none h-6 px-2 text-xs"
                      onClick={() => window.open(ad.link, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevAd}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={nextAd}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
        {ads.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentAd(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentAd ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
