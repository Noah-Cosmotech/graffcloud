import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

type PlanStatus = 'active' | 'trial' | 'cancelled' | 'past_due'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Map a Stripe subscription status to our entitlement state. Anything that
// isn't a genuinely paying/trialing state must NOT grant access: dunning
// states become 'past_due' and everything unknown defaults to 'cancelled'.
function mapSubStatus(s: Stripe.Subscription.Status): PlanStatus {
  switch (s) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'cancelled'
    default:
      return 'cancelled'
  }
}

// Returns true on success. On failure we log and signal the caller to return a
// non-2xx so Stripe retries the event rather than dropping it.
async function updateUser(
  match: { id: string } | { email: string },
  patch: Record<string, string>
): Promise<boolean> {
  const db = adminClient()
  const q = db.from('users').update(patch)
  const { error } = 'id' in match ? await q.eq('id', match.id) : await q.eq('email', match.email)
  if (error) {
    console.error('webhook user update failed:', error.message)
    return false
  }
  return true
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

  let ok = true

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan
      if (userId && plan) {
        ok = await updateUser({ id: userId }, { plan, plan_status: 'active' })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const planStatus = mapSubStatus(sub.status)
      const userId = sub.metadata?.user_id
      if (userId) {
        ok = await updateUser({ id: userId }, { plan_status: planStatus })
      } else {
        const email = await resolveCustomerEmail(sub.customer as string)
        if (email) ok = await updateUser({ email }, { plan_status: planStatus })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (userId) {
        ok = await updateUser({ id: userId }, { plan_status: 'cancelled' })
      } else {
        const email = await resolveCustomerEmail(sub.customer as string)
        if (email) ok = await updateUser({ email }, { plan_status: 'cancelled' })
      }
      break
    }
  }

  // If a DB write failed, return 500 so Stripe redelivers the event instead of
  // treating a paying customer's provisioning as done.
  if (!ok) {
    return NextResponse.json({ error: 'Failed to apply subscription state' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
