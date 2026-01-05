# Syclar Production Setup Guide

## Overview
This guide will help you set up Syclar for production with Supabase (auth + database) and Stripe (payments).

---

## 1. Environment Variables

Create a `.env` file in the project root with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_STRIPE_PRICE_ID=price_your_price_id

# Gemini AI (existing)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 2. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key to your `.env` file

### Database Schema
Run this SQL in the Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'trialing', 'active', 'canceled', 'past_due')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User data table (for app data sync)
CREATE TABLE public.user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Policies for user_data
CREATE POLICY "Users can view own data" ON public.user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.user_data
  FOR UPDATE USING (auth.uid() = user_id);
```

### Authentication Settings
1. Go to Authentication → URL Configuration
2. Set Site URL to your production URL (e.g., `https://syclar.vercel.app`)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

---

## 3. Stripe Setup

### Create Account & Product
1. Go to [stripe.com](https://stripe.com) and create an account
2. Create a new Product:
   - Name: "Syclar Premium"
   - Price: $29/month recurring
3. Copy the Price ID (starts with `price_`)

### Configure Stripe
1. Get your Publishable Key from Developers → API Keys
2. Add both to your `.env` file

### Create Stripe Webhook
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

---

## 4. Supabase Edge Functions

Create these edge functions in your Supabase project:

### Function 1: create-checkout-session

```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the JWT token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { userId, email, priceId, trialDays, successUrl, cancelUrl } = await req.json()
    
    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create or get customer
    const customers = await stripe.customers.list({ email, limit: 1 })
    let customerId = customers.data[0]?.id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    // Create checkout session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: trialDays,
        metadata: { supabase_user_id: userId },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: userId },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Function 2: stripe-webhook

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@13.10.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const updateProfile = async (customerId: string, data: any) => {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    const userId = customer.metadata.supabase_user_id
    
    if (userId) {
      await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', userId)
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await updateProfile(session.customer as string, {
          stripe_customer_id: session.customer,
          subscription_id: subscription.id,
          subscription_status: subscription.status,
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
      }
      break
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      await updateProfile(subscription.customer as string, {
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      break
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await updateProfile(subscription.customer as string, {
        subscription_status: 'canceled',
        subscription_id: null,
      })
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

### Function 3: create-portal-session

```typescript
// supabase/functions/create-portal-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@13.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, returnUrl } = await req.json()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session
```

---

## 5. Vercel Deployment

### Environment Variables
Add these in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_ID`
- `GEMINI_API_KEY`

### Build Settings
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 6. Testing Checklist

- [ ] User can sign up and receives confirmation email
- [ ] User can log in after confirming email
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users without subscription redirected to subscribe page
- [ ] Stripe checkout creates subscription with 3-day trial
- [ ] User can access app during trial
- [ ] User can manage billing via Stripe portal
- [ ] Subscription status updates via webhook

---

## Support

If you run into issues:
1. Check Supabase logs for auth/database errors
2. Check Stripe webhook logs for payment issues
3. Check browser console for frontend errors


