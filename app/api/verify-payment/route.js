import crypto from 'crypto'

async function createRouteClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const { createServerClient } = await import('@supabase/ssr')
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  )
}

export async function POST(request) {
  try {
    const supabase = await createRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ success: false, error: 'Not logged in' }, { status: 401 })
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await request.json()

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // Check duplicate order
    const { data: existingOrder } = await supabase
      .from('users')
      .select('razorpay_order_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (existingOrder) {
      return Response.json({ success: true, message: 'Already processed' })
    }

    // Calculate expiry
    const now = new Date()
    const expiry = new Date(now)
    if (plan === 'weekly') {
      expiry.setDate(expiry.getDate() + 7)
    } else if (plan === 'pro') {
      expiry.setDate(expiry.getDate() + 30)
    }

    // Update Supabase
    await supabase
      .from('users')
      .update({
        plan,
        plan_status: 'active',
        plan_expiry: expiry.toISOString(),
        generates_used: 0,
        generates_reset_date: now.toISOString(),
        razorpay_order_id
      })
      .eq('id', user.id)

    return Response.json({ success: true })

  } catch (err) {
    console.error('Verify payment error:', err)
    return Response.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}