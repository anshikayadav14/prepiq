import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id

      // Check duplicate
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, razorpay_order_id')
        .eq('razorpay_order_id', orderId)
        .single()

      if (existingUser) {
        return Response.json({ success: true, message: 'Already processed' })
      }
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: 'Webhook failed' }, { status: 500 })
  }
}