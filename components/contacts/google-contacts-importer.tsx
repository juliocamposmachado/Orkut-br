"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Send, Users, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GoogleContact {
  name: string
  email: string
  phone?: string
}

interface GoogleContactsImporterProps {
  onContactsImported: (count: number) => void
  onError: (message: string) => void
}

export default function GoogleContactsImporter({ onContactsImported, onError }: GoogleContactsImporterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [contacts, setContacts] = useState<GoogleContact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Filtered contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadGoogleContacts = async () => {
    setIsLoading(true)
    try {
      // First, get the auth URL from our backend
      const response = await fetch('/api/import-google-contacts')
      const { authUrl } = await response.json()

      if (!authUrl) {
        throw new Error('Não foi possível gerar URL de autenticação')
      }

      // Open popup for OAuth
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=650')

      // Wait for OAuth callback
      const accessToken = await new Promise<string>((resolve, reject) => {
        const onMessage = (event: MessageEvent) => {
          const data = event.data as any
          if (!data || typeof data !== 'object') return

          if (data.type === 'google-contacts-token' && data.accessToken) {
            window.removeEventListener('message', onMessage)
            resolve(data.accessToken)
            popup?.close()
          } else if (data.type === 'google-contacts-error') {
            window.removeEventListener('message', onMessage)
            reject(new Error(data.error || 'Erro no OAuth'))
            popup?.close()
          }
        }

        window.addEventListener('message', onMessage)

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', onMessage)
            reject(new Error('Autenticação cancelada'))
          }
        }, 1000)
      })

      // Now load contacts directly from Google API
      await loadContactsFromGoogle(accessToken)

    } catch (error) {
      console.error('Error loading Google contacts:', error)
      onError(error instanceof Error ? error.message : 'Erro ao carregar contatos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadContactsFromGoogle = async (accessToken: string) => {
    try {
      // Use Google People API directly
      const response = await fetch(`https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao acessar API do Google')
      }

      const data = await response.json()
      const connections = data.connections || []

      // Process contacts
      const processedContacts: GoogleContact[] = []

      for (const connection of connections) {
        const names = connection.names || []
        const emails = connection.emailAddresses || []
        const phones = connection.phoneNumbers || []

        // Get primary name
        const primaryName = names.find((name: any) => name.metadata?.primary) || names[0]
        const displayName = primaryName?.displayName || primaryName?.givenName || ''

        // Get primary email
        const primaryEmail = emails.find((email: any) => email.metadata?.primary) || emails[0]
        const email = primaryEmail?.value

        // Get primary phone
        const primaryPhone = phones.find((phone: any) => phone.metadata?.primary) || phones[0]
        const phone = primaryPhone?.value

        if (email && displayName) {
          processedContacts.push({
            name: displayName,
            email: email.toLowerCase(),
            phone: phone || undefined
          })
        }
      }

      // Remove duplicates
      const uniqueContacts = processedContacts.filter((contact, index, self) =>
        index === self.findIndex(c => c.email === contact.email)
      )

      setContacts(uniqueContacts)
      setSelectedContacts(new Set()) // Reset selection
      
    } catch (error) {
      console.error('Error processing Google contacts:', error)
      throw error
    }
  }

  const toggleContactSelection = (email: string) => {
    const newSelection = new Set(selectedContacts)
    if (newSelection.has(email)) {
      newSelection.delete(email)
    } else {
      newSelection.add(email)
    }
    setSelectedContacts(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.email)))
    }
  }

  const sendSelectedContacts = async () => {
    if (selectedContacts.size === 0) {
      onError('Selecione pelo menos um contato para enviar')
      return
    }

    setIsSending(true)
    try {
      const contactsToSend = contacts.filter(contact => selectedContacts.has(contact.email))

      const response = await fetch('/api/import-google-contacts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contacts: contactsToSend })
      })

      const result = await response.json()

      if (result.success) {
        onContactsImported(result.imported || selectedContacts.size)
        // Reset state
        setContacts([])
        setSelectedContacts(new Set())
      } else {
        onError(result.error || 'Erro ao enviar contatos')
      }
    } catch (error) {
      console.error('Error sending contacts:', error)
      onError('Erro ao enviar contatos para o servidor')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Load contacts button */}
      {contacts.length === 0 && (
        <Button
          onClick={loadGoogleContacts}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando contatos...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Importar do Google
            </>
          )}
        </Button>
      )}

      {/* Contacts table */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Contatos do Google ({contacts.length})
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedContacts.size} selecionados
                </Badge>
                <Button
                  onClick={() => {
                    setContacts([])
                    setSelectedContacts(new Set())
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and select all */}
            <div className="mb-4 space-y-3">
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Selecionar todos ({filteredContacts.length})
                </label>
              </div>
            </div>

            {/* Contacts list */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.email}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={selectedContacts.has(contact.email)}
                    onCheckedChange={() => toggleContactSelection(contact.email)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-xs text-gray-400">{contact.phone}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredContacts.length === 0 && searchTerm && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum contato encontrado com "{searchTerm}"
                </AlertDescription>
              </Alert>
            )}

            {/* Send button */}
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={sendSelectedContacts}
                disabled={selectedContacts.size === 0 || isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar {selectedContacts.size} contatos selecionados
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
