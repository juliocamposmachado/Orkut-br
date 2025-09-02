import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Contact {
  name: string
  email: string
  phone?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { contacts } = body as { contacts: Contact[] }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Lista de contatos é obrigatória' }, { status: 400 })
    }

    console.log(`📨 Processando ${contacts.length} contatos selecionados para usuário ${session.user.id}`)

    // Validate contact format
    const validContacts = contacts.filter(contact => 
      contact.email && 
      contact.name && 
      typeof contact.email === 'string' && 
      typeof contact.name === 'string'
    )

    if (validContacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato válido encontrado' }, { status: 400 })
    }

    // Remove duplicates by email
    const uniqueContacts = validContacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.email.toLowerCase() === contact.email.toLowerCase())
    )

    // Filter out contacts that are already users
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('email')
      .in('email', uniqueContacts.map(c => c.email.toLowerCase()))

    const existingEmails = new Set(existingUsers?.map(u => u.email.toLowerCase()) || [])
    const newContacts = uniqueContacts.filter(contact => 
      !existingEmails.has(contact.email.toLowerCase())
    )

    console.log(`📊 Estatísticas:`, {
      total: contacts.length,
      valid: validContacts.length,
      unique: uniqueContacts.length,
      new: newContacts.length,
      existing: uniqueContacts.length - newContacts.length
    })

    if (newContacts.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        existing: uniqueContacts.length,
        message: 'Todos os contatos já são usuários da plataforma'
      })
    }

    // Prepare contacts for insertion
    const contactsToSave = newContacts.map(contact => ({
      inviter_id: session.user.id,
      email: contact.email.toLowerCase(),
      name: contact.name,
      phone: contact.phone || null,
      source: 'google',
      status: 'imported' // Not sent yet, just imported
    }))

    // Delete existing imported contacts from Google for this user to avoid duplicates
    await supabase
      .from('email_invites')
      .delete()
      .eq('inviter_id', session.user.id)
      .eq('source', 'google')
      .eq('status', 'imported')

    // Insert new contacts
    const { error: insertError, data: insertedData } = await supabase
      .from('email_invites')
      .insert(contactsToSave)
      .select()

    if (insertError) {
      console.error('❌ Error saving contacts:', insertError)
      return NextResponse.json(
        { 
          error: 'Erro ao salvar contatos no banco de dados',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    console.log(`✅ Contatos salvos com sucesso:`, {
      imported: contactsToSave.length,
      existing: uniqueContacts.length - newContacts.length
    })

    return NextResponse.json({
      success: true,
      imported: contactsToSave.length,
      existing: uniqueContacts.length - newContacts.length,
      total: uniqueContacts.length,
      contacts: insertedData || contactsToSave
    })

  } catch (error) {
    console.error('❌ Error processing selected contacts:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
