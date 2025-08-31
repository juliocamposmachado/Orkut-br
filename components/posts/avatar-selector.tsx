'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserCircle, Shuffle } from 'lucide-react'
import { orkutAvatars, avatarCategories, getAvatarsByCategory, getRandomAvatar, type OrkutAvatar } from '@/data/orkut-avatars'
import { toast } from 'sonner'

interface AvatarSelectorProps {
  selectedAvatar: OrkutAvatar | null
  onAvatarSelect: (avatar: OrkutAvatar | null) => void
  children: React.ReactNode
}

export function AvatarSelector({ selectedAvatar, onAvatarSelect, children }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('pessoas')

  const handleAvatarSelect = (avatar: OrkutAvatar) => {
    onAvatarSelect(avatar)
    setIsOpen(false)
    toast.success(`Avatar "${avatar.name}" selecionado! ${avatar.emoji}`, {
      description: avatar.description,
      duration: 3000,
    })
  }

  const handleRandomAvatar = () => {
    const randomAvatar = getRandomAvatar()
    handleAvatarSelect(randomAvatar)
  }

  const handleClearAvatar = () => {
    onAvatarSelect(null)
    setIsOpen(false)
    toast.success('Avatar removido! Será usado seu avatar padrão.')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-purple-600" />
            Escolher Avatar para o Post
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Selecione um avatar especial para esta postagem! 
            {selectedAvatar && (
              <span className="ml-2 font-medium text-purple-700">
                Atual: {selectedAvatar.name} {selectedAvatar.emoji}
              </span>
            )}
          </p>
        </DialogHeader>
        
        {/* Controles superiores */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRandomAvatar}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Aleatório
            </Button>
            {selectedAvatar && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAvatar}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Remover Avatar
              </Button>
            )}
          </div>
          
          {selectedAvatar && (
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
              <span className="text-2xl">{selectedAvatar.emoji}</span>
              <div>
                <p className="font-medium text-sm">{selectedAvatar.name}</p>
                <p className="text-xs text-gray-600">{selectedAvatar.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs por categoria */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            {avatarCategories.map((category) => (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="text-xs flex items-center gap-1"
              >
                <span>{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            {avatarCategories.map((category) => (
              <TabsContent
                key={category.key}
                value={category.key}
                className="h-full overflow-y-auto mt-4"
              >
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {getAvatarsByCategory(category.key).map((avatar) => (
                    <Card
                      key={avatar.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                        selectedAvatar?.id === avatar.id
                          ? 'ring-2 ring-purple-500 bg-purple-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleAvatarSelect(avatar)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="text-3xl mb-2">{avatar.emoji}</div>
                        <h4 className="font-medium text-xs text-gray-800 leading-tight">
                          {avatar.name}
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                          {avatar.description}
                        </p>
                        {selectedAvatar?.id === avatar.id && (
                          <Badge className="mt-2 bg-purple-500 text-white text-[10px] py-0">
                            Selecionado
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Footer da categoria */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    {getAvatarsByCategory(category.key).length} avatars disponíveis em {category.name}
                  </p>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
        
        {/* Dica no rodapé */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 <strong>Dica nostálgica:</strong> Escolha um avatar que represente seu humor para este post! 
            Lembra dos avatars dos fóruns dos anos 2000? 😊
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
