import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'

// Email template
const getEmailTemplate = (inviterName: string, inviterEmail: string, message?: string, inviteToken?: string) => {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${inviteToken}`
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Convite para o Orkut.BR</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .invite-message {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
          }
          .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
          }
          .feature {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          @media (max-width: 480px) {
            .features {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 ORKUT.BR</h1>
          <p>A nova rede social brasileira!</p>
        </div>
        
        <div class="content">
          <h2>Você foi convidado! 🎉</h2>
          
          <p>Olá!</p>
          
          <p><strong>${inviterName}</strong> (${inviterEmail}) te convidou para fazer parte do <strong>Orkut.BR</strong>, a nova rede social que está trazendo de volta a nostalgia dos tempos dourados da internet!</p>
          
          ${message ? `
            <div class="invite-message">
              <h3>💬 Mensagem pessoal:</h3>
              <p><em>"${message}"</em></p>
            </div>
          ` : ''}
          
          <div class="features">
            <div class="feature">
              <div class="feature-icon">👥</div>
              <strong>Conecte-se com amigos</strong>
              <p>Reencontre pessoas e faça novos amigos</p>
            </div>
            <div class="feature">
              <div class="feature-icon">💬</div>
              <strong>Scraps e mensagens</strong>
              <p>Deixe recadinhos no perfil dos amigos</p>
            </div>
            <div class="feature">
              <div class="feature-icon">🎨</div>
              <strong>Perfis personalizáveis</strong>
              <p>Customize seu perfil do seu jeito</p>
            </div>
            <div class="feature">
              <div class="feature-icon">🏆</div>
              <strong>Comunidades e fãs</strong>
              <p>Participe de comunidades incríveis</p>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="btn">
              🚀 Aceitar Convite e Criar Conta
            </a>
          </div>
          
          <p><small>Ou copie e cole este link no seu navegador:<br>
          <a href="${inviteUrl}">${inviteUrl}</a></small></p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <h3>🔥 Por que você vai amar o Orkut.BR:</h3>
          <ul>
            <li><strong>Nostalgia em dose dupla:</strong> Tudo que você amava no Orkut original</li>
            <li><strong>Comunidade brasileira:</strong> Feito por brasileiros, para brasileiros</li>
            <li><strong>Interface moderna:</strong> Design atual com a alma do Orkut clássico</li>
            <li><strong>Privacidade respeitada:</strong> Seus dados são seus</li>
            <li><strong>Totalmente gratuito:</strong> Sem pegadinhas, sempre free!</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Este convite foi enviado por ${inviterName} através do Orkut.BR</p>
          <p>Se você não deseja receber estes emails, pode ignorar esta mensagem.</p>
          <p>© 2024 Orkut.BR - Todos os direitos reservados</p>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', session.user.id)
      .single()

    const { emails, message } = await request.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Lista de emails é obrigatória' }, { status: 400 })
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Process each email
    const results = []
    
    for (const emailData of emails) {
      const { email, name } = emailData
      
      try {
        // Check if invite already exists
        const { data: existingInvite } = await supabase
          .from('email_invites')
          .select('id')
          .eq('inviter_id', session.user.id)
          .eq('email', email)
          .single()

        let inviteToken: string

        if (existingInvite) {
          // Update existing invite
          const { data: updatedInvite } = await supabase
            .from('email_invites')
            .update({
              invited_at: new Date().toISOString(),
              message: message || null,
              status: 'sent'
            })
            .eq('id', existingInvite.id)
            .select('invite_token')
            .single()
          
          inviteToken = updatedInvite?.invite_token
        } else {
          // Create new invite record
          const { data: newInvite, error: inviteError } = await supabase
            .from('email_invites')
            .insert({
              inviter_id: session.user.id,
              email,
              name: name || null,
              message: message || null,
              status: 'sent',
              source: 'manual'
            })
            .select('invite_token')
            .single()

          if (inviteError) throw inviteError
          inviteToken = newInvite.invite_token
        }

        // Send email
        const mailOptions = {
          from: `"${profile?.display_name || 'Orkut.BR'}" <${process.env.SMTP_FROM}>`,
          to: email,
          subject: `🌟 ${profile?.display_name || 'Alguém'} te convidou para o Orkut.BR!`,
          html: getEmailTemplate(
            profile?.display_name || session.user.email || 'Um amigo',
            session.user.email || '',
            message,
            inviteToken
          )
        }

        await transporter.sendMail(mailOptions)
        
        results.push({
          email,
          status: 'sent',
          message: 'Convite enviado com sucesso'
        })

      } catch (error) {
        console.error(`Error sending invite to ${email}:`, error)
        results.push({
          email,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: emails.length,
      sent: results.filter(r => r.status === 'sent').length,
      errors: results.filter(r => r.status === 'error').length
    })

  } catch (error) {
    console.error('Error in send-invite API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
