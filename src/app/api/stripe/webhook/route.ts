import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function setUserPlan(userId: string, plan: string, status: 'active' | 'trial' | 'cancelled') {
  const db = adminClient()
  await db.from('users').update({ plan, plan_status: status }).eq('id', userId)
}

async function setPlanStatusByEmail(email: string, status: 'active' | 'trial' | 'cancelled') {
  const db = adminClient()
  await db.from('users').update({ plan_status: status }).eq('email', email)
}

async function resolveCustomerEmail(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).email ?? null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan
      if (userId && plan) {
        await setUserPlan(userId, plan, 'active')
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      const stripeStatus = sub.status
      const planStatus: 'active' | 'trial' | 'cancelled' =
        stripeStatus === 'active' || stripeStatus === 'trialing' ? 'active'
        : stripeStatus === 'canceled' ? 'cancelled'
        : 'trial'

      if (userId) {
        const db = adminClient()
        await db.from('users').update({ plan_status: planStatus }).eq('id', userId)
      } else {
        const email = await resolveCustomerEmail(sub.customer as string)
        if (email) await setPlanStatusByEmail(email, planStatus)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (userId) {
        const db = adminClient()
        await db.from('users').update({ plan_status: 'cancelled' }).eq('id', userId)
      } else {
        const email = await resolveCustomerEmail(sub.customer as string)
        if (email) await setPlanStatusByEmail(email, 'cancelled')
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
