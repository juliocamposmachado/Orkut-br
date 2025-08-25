import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { accessToken } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Token de acesso é obrigatório' }, { status: 400 })
    }

    // Configure Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      access_token: accessToken
    })

    // Get Google People API
    const people = google.people({ version: 'v1', auth: oauth2Client })

    // Fetch contacts
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 1000,
      personFields: 'names,emailAddresses,phoneNumbers'
    })

    const connections = response.data.connections || []
    const contacts = []

    // Process contacts
    for (const connection of connections) {
      const names = connection.names || []
      const emails = connection.emailAddresses || []
      const phones = connection.phoneNumbers || []

      // Get primary name
      const primaryName = names.find(name => name.metadata?.primary) || names[0]
      const displayName = primaryName?.displayName || primaryName?.givenName || ''

      // Get primary email
      const primaryEmail = emails.find(email => email.metadata?.primary) || emails[0]
      const email = primaryEmail?.value

      // Get primary phone
      const primaryPhone = phones.find(phone => phone.metadata?.primary) || phones[0]
      const phone = primaryPhone?.value

      if (email && displayName) {
        contacts.push({
          name: displayName,
          email: email.toLowerCase(),
          phone: phone || null
        })
      }
    }

    // Remove duplicates
    const uniqueContacts = contacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.email === contact.email)
    )

    // Filter out contacts that are already users
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('email')
      .in('email', uniqueContacts.map(c => c.email))

    const existingEmails = new Set(existingUsers?.map(u => u.email) || [])
    const newContacts = uniqueContacts.filter(contact => !existingEmails.has(contact.email))

    // Save contacts to database for future reference
    const contactsToSave = newContacts.map(contact => ({
      inviter_id: session.user.id,
      email: contact.email,
      name: contact.name,
      phone: contact.phone,
      source: 'google',
      status: 'imported' // Not sent yet
    }))

    if (contactsToSave.length > 0) {
      // Delete existing imported contacts from Google for this user to avoid duplicates
      await supabase
        .from('email_invites')
        .delete()
        .eq('inviter_id', session.user.id)
        .eq('source', 'google')
        .eq('status', 'imported')

      // Insert new contacts
      const { error: insertError } = await supabase
        .from('email_invites')
        .insert(contactsToSave)

      if (insertError) {
        console.error('Error saving contacts:', insertError)
      }
    }

    return NextResponse.json({
      success: true,
      total: uniqueContacts.length,
      imported: newContacts.length,
      existing: uniqueContacts.length - newContacts.length,
      contacts: newContacts
    })

  } catch (error) {
    console.error('Error importing Google contacts:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao importar contatos do Google',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// Get Google OAuth2 URL
export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true
    })

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Error generating Google auth URL:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autenticação' },
      { status: 500 }
    )
  }
}
