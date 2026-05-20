import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// Return JSON 405 for unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed. Use POST.' }, { status: 405 })
}


// Interface for API request body
interface DispatchRequestBody {
  user_id: string | null
  title: string
  message: string
  link: string | null
  event_id?: string
}

interface RunSheetItemWithSong {
  id: string
  title: string | null
  item_type: string
  key_override: string | null
  bpm_override: number | null
  song: {
    title: string
    artist: string | null
    default_key: string | null
    default_bpm: number | null
  } | null
}

interface SongLineupItem {
  title: string
  artist: string
  key: string
  bpm: number | null
}

export async function POST(request: Request) {
  try {
    const body: DispatchRequestBody = await request.json()
    const { user_id, title, message, link, event_id } = body

    const supabase = await createClient()

    // 1. Resolve target users
    let targetUsers: { id: string; first_name: string; last_name: string; email: string; phone_number: string | null }[] = []

    if (user_id) {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone_number')
        .eq('id', user_id)
        .single()

      if (userErr || !user) {
        return NextResponse.json({ error: 'Target volunteer profile not found' }, { status: 404 })
      }
      targetUsers = [user]
    } else {
      // Broadcast to all approved users if user_id is null
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone_number')
        .eq('approval_status', 'approved')

      if (allUsers) {
        targetUsers = allUsers
      }
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'No target volunteers found' }, { status: 400 })
    }

    // 2. Fetch Event details and Song Lineup
    let eventName = 'Upcoming Event'
    let eventDateStr = 'Scheduled Date'
    let callTimeStr = ''
    const songLineup: SongLineupItem[] = []

    if (event_id) {
      const { data: eventData } = await supabase
        .from('events')
        .select('name, event_datetime, call_time')
        .eq('id', event_id)
        .single()

      if (eventData) {
        eventName = eventData.name
        const d = new Date(eventData.event_datetime)
        eventDateStr = d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        if (eventData.call_time) {
          const c = new Date(eventData.call_time)
          callTimeStr = c.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }

      // Fetch all runsheet items that are songs for this event
      const { data: runsheetData } = await supabase
        .from('run_sheet_items')
        .select('id, title, item_type, key_override, bpm_override, song:song_library(title, artist, default_key, default_bpm)')
        .eq('event_id', event_id)
        .eq('item_type', 'song')
        .order('order_index', { ascending: true })

      if (runsheetData) {
        const items = runsheetData as unknown as RunSheetItemWithSong[]
        items.forEach((item) => {
          let songTitle = item.title || ''
          let artist = ''
          let key = item.key_override || ''
          let bpm = item.bpm_override || null

          if (item.song) {
            const s = item.song
            if (!songTitle) songTitle = s.title || ''
            artist = s.artist || ''
            if (!key) key = s.default_key || ''
            if (!bpm) bpm = s.default_bpm || null
          }

          if (songTitle) {
            songLineup.push({ title: songTitle, artist, key, bpm })
          }
        })
      }
    }

    // Build lineup strings for SMS
    const songLineupCompact = songLineup.length > 0
      ? songLineup.map((s, idx) => `${idx + 1}. ${s.title}${s.key ? ` (${s.key})` : ''}`).join(', ')
      : 'No songs scheduled yet'

    // Credentials detection
    const resendApiKey = process.env.RESEND_API_KEY
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    const results = []

    for (const u of targetUsers) {
      // 3. Construct beautiful styled HTML email body
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 24px auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 32px 24px;
    }
    .message-box {
      background-color: #f3f4f6;
      border-left: 4px solid #4f46e5;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 24px;
      font-size: 15px;
    }
    .details-box {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 28px;
      background-color: #fafafa;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-label {
      font-weight: 600;
      color: #4b5563;
    }
    .details-value {
      color: #111827;
      text-align: right;
    }
    .lineup-section {
      margin-top: 28px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
    .lineup-title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .lineup-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .lineup-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 4px;
      background-color: #f9fafb;
      align-items: center;
    }
    .lineup-name {
      font-weight: 600;
      color: #374151;
    }
    .lineup-role {
      color: #6b7280;
      font-size: 13px;
    }
    .btn-container {
      text-align: center;
      margin-top: 28px;
    }
    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ministry Coordinator Alert</h1>
    </div>
    <div class="content">
      <div class="message-box">
        <strong>Hello ${u.first_name},</strong><br>
        ${message}
      </div>

      <div class="details-box">
        <div class="details-row">
          <span class="details-label">Service / Event</span>
          <span class="details-value" style="font-weight: 600;">${eventName}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Date & Time</span>
          <span class="details-value">${eventDateStr}</span>
        </div>
        ${callTimeStr ? `
        <div class="details-row">
          <span class="details-label">Call Time</span>
          <span class="details-value" style="color: #4f46e5; font-weight: 600;">${callTimeStr}</span>
        </div>` : ''}
      </div>

      ${songLineup.length > 0 ? `
      <div class="lineup-section">
        <div class="lineup-title">🎵 Song Setlist Lineup</div>
        <ul class="lineup-list">
          ${songLineup.map((s, idx) => `
            <li class="lineup-item">
              <span class="lineup-name">
                ${idx + 1}. ${s.title}
                ${s.artist ? `<span style="font-weight: normal; color: #6b7280; font-size: 13px;">by ${s.artist}</span>` : ''}
              </span>
              <span class="lineup-role" style="font-weight: 600; color: #4f46e5;">
                ${s.key ? `Key: ${s.key}` : ''}${s.bpm ? ` | ${s.bpm} BPM` : ''}
              </span>
            </li>
          `).join('')}
        </ul>
      </div>` : ''}

      ${link ? `
      <div class="btn-container">
        <a href="${link.startsWith('http') ? link : 'http://localhost:3000' + link}" class="btn">View Schedule & Respond</a>
      </div>` : ''}
    </div>
    <div class="footer">
      This is an automated ministry schedule alert. Please log in to accept or decline your shifts.<br>
      &copy; ${new Date().getFullYear()} Volunteer Coordination Platform.
    </div>
  </div>
</body>
</html>
`

      // 4. Construct compact SMS text
      const smsText = `Church schedule update:
You are assigned to ${eventName} on ${eventDateStr.split(' at ')[0]}.
${callTimeStr ? `Call Time: ${callTimeStr}.\n` : ''}
🎵 Songs: ${songLineupCompact}
Respond here: ${link ? (link.startsWith('http') ? link : 'http://localhost:3000' + link) : 'http://localhost:3000/dashboard'}`

      // 5. Trigger email dispatch
      let emailStatus: 'sent' | 'failed' | 'simulated' = 'simulated'
      if (resendApiKey) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'Ministry Scheduling <onboarding@resend.dev>',
              to: u.email,
              subject: `${title}: ${eventName}`,
              html: emailHtml
            })
          })
          if (emailResponse.ok) {
            emailStatus = 'sent'
          } else {
            console.error('Resend delivery failed with status:', emailResponse.status)
            emailStatus = 'failed'
          }
        } catch (err) {
          console.error('Error calling Resend REST API:', err)
          emailStatus = 'failed'
        }
      } else {
        // Safe sandbox fallback: print beautifully styled mock to server terminal logs
        console.log('\n========================================================================')
        console.log(`✉️  [SIMULATED EMAIL] To: ${u.email} | Subject: ${title}: ${eventName}`)
        console.log('------------------------------------------------------------------------')
        console.log(`Volunteer: ${u.first_name} ${u.last_name}`)
        console.log(`Message: ${message}`)
        console.log(`Event details: ${eventName} on ${eventDateStr}`)
        console.log(`🎵 Songs scheduled:\n${songLineup.map((s, idx) => `   ${idx + 1}. ${s.title}${s.artist ? ` by ${s.artist}` : ''}${s.key ? ` (Key: ${s.key})` : ''}`).join('\n') || '   - None'}`)
        console.log('========================================================================\n')
      }

      // Log email notification log to database
      await supabase.from('notifications_log').insert({
        user_id: u.id,
        channel: 'email',
        type: 'shift_assigned',
        content_preview: `Subject: ${title} | ${message.substring(0, 100)}...`,
        status: emailStatus,
        sent_at: new Date().toISOString()
      })

      // 6. Trigger SMS dispatch if phone is available
      let smsStatus: 'sent' | 'failed' | 'simulated' = 'simulated'
      if (u.phone_number) {
        // Automatically format local Philippine numbers (starts with 09... or 9...) to E.164 (+639...)
        const rawPhone = u.phone_number.trim()
        let formattedPhone = rawPhone
        if (rawPhone.startsWith('09') && rawPhone.length === 11) {
          formattedPhone = '+63' + rawPhone.substring(1)
        } else if (rawPhone.startsWith('9') && rawPhone.length === 10) {
          formattedPhone = '+63' + rawPhone
        } else if (!rawPhone.startsWith('+')) {
          formattedPhone = '+63' + rawPhone.replace(/^0+/, '')
        }

        if (twilioSid && twilioToken && twilioPhone) {
          try {
            const formData = new URLSearchParams()
            formData.append('From', twilioPhone)
            formData.append('To', formattedPhone)
            formData.append('Body', smsText)

            const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(twilioSid + ':' + twilioToken).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: formData.toString()
            })

            if (smsResponse.ok) {
              smsStatus = 'sent'
            } else {
              console.error('Twilio SMS delivery failed with status:', smsResponse.status)
              smsStatus = 'failed'
            }
          } catch (err) {
            console.error('Error calling Twilio REST API:', err)
            smsStatus = 'failed'
          }
        } else {
          // Safe sandbox fallback: print SMS text directly to server terminal log
          console.log('\n========================================================================')
          console.log(`📱 [SIMULATED SMS] To: ${formattedPhone} (orig: ${u.phone_number})`)
          console.log('------------------------------------------------------------------------')
          console.log(smsText)
          console.log('========================================================================\n')
        }

        // Log SMS notification log to database
        await supabase.from('notifications_log').insert({
          user_id: u.id,
          channel: 'sms',
          type: 'shift_assigned',
          content_preview: smsText.substring(0, 150),
          status: smsStatus,
          sent_at: new Date().toISOString()
        })
      }

      results.push({
        user_id: u.id,
        email: u.email,
        email_status: emailStatus,
        sms_status: u.phone_number ? smsStatus : 'no_phone'
      })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Notification dispatch route error:', errMsg)
    return NextResponse.json({ error: 'Internal Server Error', details: errMsg }, { status: 500 })
  }
}
