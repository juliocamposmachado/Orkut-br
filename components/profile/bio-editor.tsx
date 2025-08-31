'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit3, Save, X } from 'lucide-react'

interface BioEditorProps {
  bio?: string
  isOwnProfile: boolean
  onSave: (newBio: string) => void
}

export const BioEditor: React.FC<BioEditorProps> = ({ bio, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState(bio || '')

  const handleSave = () => {
    onSave(editedBio)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedBio(bio || '')
    setIsEditing(false)
  }

  if (!isOwnProfile && !bio) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>Este usuário ainda não adicionou uma biografia.</p>
      </div>
    )
  }

  if (!isOwnProfile && bio) {
    return (
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Sobre mim:</h4>
        <p className="text-gray-700">{bio}</p>
      </div>
    )
  }

  return (
    <div>
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
            className="min-h-[80px] resize-none border-purple-200 focus:border-purple-400"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 text-right">
            {editedBio.length}/500 caracteres
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {bio ? (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-800">Sobre mim:</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1 h-auto"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-gray-700">{bio}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3">Adicione uma biografia ao seu perfil!</p>
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Edit3 className="h-3 w-3 mr-2" />
                Adicionar Biografia
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
