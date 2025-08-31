import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Parse CSV content
function parseCSV(csvContent: string) {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line)
  if (lines.length === 0) return []

  // Try to detect if first line is header
  const firstLine = lines[0].toLowerCase()
  let isHeaderPresent = false
  let emailIndex = 0
  let nameIndex = 1
  let phoneIndex = 2

  // Check common header patterns
  if (firstLine.includes('email') || firstLine.includes('nome') || firstLine.includes('name') || firstLine.includes('telefone') || firstLine.includes('phone')) {
    isHeaderPresent = true
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Find column indexes
    emailIndex = headers.findIndex(h => h.includes('email') || h.includes('e-mail'))
    nameIndex = headers.findIndex(h => h.includes('nome') || h.includes('name'))
    phoneIndex = headers.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('celular'))
    
    // If not found, use defaults
    if (emailIndex === -1) emailIndex = 0
    if (nameIndex === -1) nameIndex = 1
    if (phoneIndex === -1) phoneIndex = 2
  }

  const dataLines = isHeaderPresent ? lines.slice(1) : lines
  const contacts = []

  for (const line of dataLines) {
    const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
    
    if (columns.length > emailIndex && columns[emailIndex]) {
      const email = columns[emailIndex].toLowerCase()
      const name = columns[nameIndex] || ''
      const phone = columns[phoneIndex] || null

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(email)) {
        contacts.push({
          email,
          name: name || email.split('@')[0], // Use part before @ if no name
          phone: phone && phone.length > 5 ? phone : null
        })
      }
    }
  }

  return contacts
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Apenas arquivos CSV são permitidos' }, { status: 400 })
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 5MB)' }, { status: 400 })
    }

    // Read file content
    const csvContent = await file.text()
    
    if (!csvContent.trim()) {
      return NextResponse.json({ error: 'Arquivo CSV está vazio' }, { status: 400 })
    }

    // Parse CSV
    const contacts = parseCSV(csvContent)
    
    if (contacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato válido encontrado no arquivo CSV' }, { status: 400 })
    }

    // Remove duplicates
    const uniqueContacts = contacts.filter((contact, index, self) => 
      index === self.findIndex(c => c.email === contact.email)
    )

    // Check if contacts are already users
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('email')
      .in('email', uniqueContacts.map(c => c.email))

    const existingEmails = new Set(existingUsers?.map(u => u.email) || [])
    const newContacts = uniqueContacts.filter(contact => !existingEmails.has(contact.email))

    // Save contacts to database
    if (newContacts.length > 0) {
      const contactsToSave = newContacts.map(contact => ({
        inviter_id: session.user.id,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        source: 'csv',
        status: 'imported' // Not sent yet
      }))

      // Delete existing imported contacts from CSV for this user to avoid duplicates
      await supabase
        .from('email_invites')
        .delete()
        .eq('inviter_id', session.user.id)
        .eq('source', 'csv')
        .eq('status', 'imported')

      // Insert new contacts
      const { error: insertError } = await supabase
        .from('email_invites')
        .insert(contactsToSave)

      if (insertError) {
        console.error('Error saving CSV contacts:', insertError)
        return NextResponse.json({ error: 'Erro ao salvar contatos' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      total: uniqueContacts.length,
      imported: newContacts.length,
      existing: uniqueContacts.length - newContacts.length,
      contacts: newContacts,
      message: `${newContacts.length} contatos importados com sucesso!`
    })

  } catch (error) {
    console.error('Error processing CSV upload:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar arquivo CSV',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
