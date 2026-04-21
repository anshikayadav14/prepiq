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

    const { plan } = await request.json()

    const PLAN_AMOUNTS = {
      weekly: 4900,
      pro: 14900
    }

    const amount = PLAN_AMOUNTS[plan]
    if (!amount) {
      return Response.json({ success: false, error: 'Invalid plan' }, { status: 400 })
    }

    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET
        ).toString('base64')
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `receipt_${user.id}_${Date.now()}`
      })
    })

    const order = await orderRes.json()

    if (!order.id) {
      return Response.json({ success: false, error: 'Order creation failed' }, { status: 500 })
    }

    return Response.json({ success: true, orderId: order.id, amount, plan })

  } catch (err) {
    console.error('Create order error:', err)
    return Response.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}