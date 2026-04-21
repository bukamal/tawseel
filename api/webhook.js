import { supabaseAdmin } from './_lib/supabase.js'
import { sendMessage, answerPreCheckoutQuery, answerCallbackQuery } from './_lib/telegram.js'

const BOT_TOKEN = process.env.BOT_TOKEN
const FRONTEND_URL = process.env.FRONTEND_URL

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const payload = req.body

  // Pre-checkout query
  if (payload.pre_checkout_query) {
    await answerPreCheckoutQuery(payload.pre_checkout_query.id, true)
    return res.status(200).json({ ok: true })
  }

  // Successful payment
  if (payload.message?.successful_payment) {
    const payment = payload.message.successful_payment
    const chatId = payload.message.chat.id
    const invoice = payment.invoice_payload

    const { data: tx } = await supabaseAdmin
      .from('stars_transactions')
      .update({ status: 'completed', telegram_response: payment })
      .eq('invoice_payload', invoice)
      .select('ride_id')
      .single()

    if (tx?.ride_id) {
      await supabaseAdmin
        .from('rides')
        .update({ stars_payment_status: 'paid', payment_status: 'completed', status: 'searching' })
        .eq('id', tx.ride_id)
      await sendMessage(chatId, '✅ تم الدفع بنجاح! جاري البحث عن سائق...')
    }
    return res.status(200).json({ ok: true })
  }

  // Handle /start command
  if (payload.message?.text === '/start') {
    const chatId = payload.message.chat.id
    const telegramId = payload.message.from.id
    const fullName = [payload.message.from.first_name, payload.message.from.last_name].filter(Boolean).join(' ')

    let { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()
    if (!user) {
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({ telegram_id: telegramId, chat_id: chatId, full_name: fullName })
        .select()
        .single()
      user = newUser
    }

    const miniAppUrl = `${FRONTEND_URL}?tg_id=${telegramId}&chat_id=${chatId}`
    await sendMessage(chatId, '🚗 مرحباً بك في Tawseel!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ أنا زبون', callback_data: 'set_role_customer' }],
          [{ text: '🚙 أنا سائق', callback_data: 'set_role_driver' }],
          [{ text: '🚀 فتح التطبيق', web_app: { url: miniAppUrl } }]
        ]
      }
    })
  }

  // Handle callback queries
  if (payload.callback_query) {
    const q = payload.callback_query
    await answerCallbackQuery(q.id)
    const telegramId = q.from.id
    const chatId = q.message.chat.id

    if (q.data === 'set_role_customer') {
      await supabaseAdmin.from('users').update({ role: 'customer' }).eq('telegram_id', telegramId)
      await sendMessage(chatId, '✅ تم تعيينك كزبون.')
    } else if (q.data === 'set_role_driver') {
      await supabaseAdmin.from('users').update({ role: 'driver' }).eq('telegram_id', telegramId)
      await sendMessage(chatId, '✅ تم تعيينك كسائق. افتح التطبيق لإكمال بياناتك.')
    }
  }

  return res.status(200).json({ ok: true })
}
