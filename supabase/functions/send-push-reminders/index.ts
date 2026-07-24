// Dipanggil oleh pg_cron (lihat SQL di langkah setup Fase 10), bukan oleh user
// login langsung — makanya deploy dgn `--no-verify-jwt`.
//
// Secrets yang harus di-set (`supabase secrets set ...`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:email@kamu.com)
// SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia di Edge Functions.
//
// Body request menentukan job yang dijalankan:
//   { "job": "digest" }   -> ringkasan pagi (muraja'ah, tugas planned_for, event hari ini, weekly review Minggu)
//   { "job": "deadline" } -> tugas dgn due_date < 3 jam lagi, belum pernah dikirim
//
// Response selalu berisi ringkasan diagnostik (usersChecked, subsFound, sent, errors)
// supaya gampang dites manual lewat curl tanpa perlu buka Table Editor.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

function nowWIB() {
  return new Date(Date.now() + WIB_OFFSET_MS)
}

function todayLocalISO() {
  return nowWIB().toISOString().slice(0, 10)
}

function isSundayWIB() {
  return nowWIB().getUTCDay() === 0
}

type Stats = { usersChecked: number; subsFound: number; sent: number; errors: string[] }

async function sendToUser(
  userId: string,
  payload: { title: string; body: string; tag: string; url: string },
  stats: Stats,
) {
  const { data: subs, error: subsError } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
  if (subsError) {
    stats.errors.push(`query push_subscriptions ${userId}: ${subsError.message}`)
    return
  }

  stats.subsFound += subs?.length ?? 0

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        JSON.stringify(payload),
      )
      stats.sent += 1
    } catch (err) {
      const statusCode = err?.statusCode
      stats.errors.push(`push to ${sub.endpoint.slice(0, 60)}...: ${statusCode ?? ''} ${err?.body ?? err?.message ?? err}`)
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
}

// Ambil user yang PUNYA subscription push — hanya mereka yang perlu dikirimi.
// (Sekaligus menghindari auth.admin.listUsers() yang butuh admin JWT & gagal
// kalau project sudah memakai signing key ES256 baru.)
async function listSubscribedUserIds(stats: Stats): Promise<string[]> {
  const { data, error } = await supabase.from('push_subscriptions').select('user_id')
  if (error) {
    stats.errors.push(`list subscribed users: ${error.message}`)
    return []
  }
  return [...new Set((data ?? []).map((r) => r.user_id))]
}

async function runMorningDigest(stats: Stats) {
  const today = todayLocalISO()
  const userIds = await listSubscribedUserIds(stats)
  stats.usersChecked = userIds.length

  for (const userId of userIds) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('muraja_daily_cap')
      .eq('user_id', userId)
      .maybeSingle()
    const cap = settings?.muraja_daily_cap ?? 15

    const { count: murajaCount } = await supabase
      .from('hafalan_units')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_date', today)
    const { count: taskCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('planned_for', today)
      .neq('status', 'done')
    const { count: eventCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_date', today)

    const parts: string[] = []
    const murajaTotal = Math.min(murajaCount ?? 0, cap)
    if (murajaTotal > 0) parts.push(`${murajaTotal} muraja'ah`)
    if (taskCount) parts.push(`${taskCount} tugas hari ini`)
    if (eventCount) parts.push(`${eventCount} event hari ini`)
    if (isSundayWIB()) parts.push(`waktunya weekly review`)

    if (parts.length === 0) continue

    await sendToUser(
      userId,
      {
        title: 'Agenda hari ini',
        body: parts.join(', '),
        tag: `digest-${today}`,
        url: '/',
      },
      stats,
    )
  }
}

async function runDeadlineCheck(stats: Stats) {
  const now = new Date()
  const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'done')
    .is('deadline_push_sent_at', null)
    .not('due_date', 'is', null)
    .gte('due_date', now.toISOString())
    .lte('due_date', in3h.toISOString())

  stats.usersChecked = new Set((tasks ?? []).map((t) => t.user_id)).size

  for (const t of tasks ?? []) {
    await sendToUser(
      t.user_id,
      {
        title: 'Tugas mendekati tenggat',
        body: `"${t.title}" jatuh tempo ${new Date(t.due_date).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Jakarta',
        })}`,
        tag: `task-${t.id}`,
        url: '/tugas',
      },
      stats,
    )
    await supabase.from('tasks').update({ deadline_push_sent_at: new Date().toISOString() }).eq('id', t.id)
  }
}

Deno.serve(async (req) => {
  const stats: Stats = { usersChecked: 0, subsFound: 0, sent: 0, errors: [] }
  try {
    const { job } = await req.json().catch(() => ({ job: 'deadline' }))
    if (job === 'digest') {
      await runMorningDigest(stats)
    } else {
      await runDeadlineCheck(stats)
    }
    return new Response(JSON.stringify({ ok: true, job, ...stats }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err), ...stats }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
