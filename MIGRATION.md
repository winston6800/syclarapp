# Database Migration Guide

## Step 1: Add New Columns to Existing Database

Since you already have a `profiles` table, you need to add the two new columns for cancellation tracking.

### In Supabase SQL Editor:

1. Open your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query** or open a new tab
4. Run this migration SQL:

```sql
-- Add cancellation tracking columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

5. Click **Run** (or press `Ctrl + Enter`)
6. You should see "Success. No rows returned" or a table showing all columns

### Verify Migration:

Run this query to check your table structure:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see:
- `cancel_at_period_end` (boolean, default FALSE)
- `canceled_at` (timestamp with time zone, nullable)

---

## Step 2: Update Stripe Webhook Handler

Your existing `stripe-webhook` Edge Function needs to be updated to handle the new cancellation fields.

### Option A: Update via Supabase Dashboard

1. Go to **Edge Functions** in Supabase
2. Find `stripe-webhook`
3. Replace the `customer.subscription.updated` and `customer.subscription.created` case handlers with:

```typescript
case 'customer.subscription.updated':
case 'customer.subscription.created': {
  const subscription = event.data.object as Stripe.Subscription
  await updateProfile(subscription.customer as string, {
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
  })
  break
}

case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription
  await updateProfile(subscription.customer as string, {
    subscription_status: 'canceled',
    subscription_id: null,
    cancel_at_period_end: false,
    canceled_at: new Date().toISOString(),
  })
  break
}
```

4. Click **Deploy**

### Option B: Update via CLI

If you're using Supabase CLI, update the file and redeploy:

```bash
# Edit the file
code supabase/functions/stripe-webhook/index.ts

# Deploy
supabase functions deploy stripe-webhook
```

---

## Step 3: Deploy New Edge Functions

You need to create and deploy two new Edge Functions for cancellation and reactivation.

### Create `cancel-subscription` Function

1. In Supabase Dashboard → **Edge Functions** → **Create a new function**
2. Name it: `cancel-subscription`
3. Copy the code from `SETUP.md` (Function 4: cancel-subscription)
4. Click **Deploy**

Or via CLI:

```bash
# Create the function file
mkdir -p supabase/functions/cancel-subscription

# Copy the code from SETUP.md into:
# supabase/functions/cancel-subscription/index.ts

# Deploy
supabase functions deploy cancel-subscription
```

### Create `reactivate-subscription` Function

1. In Supabase Dashboard → **Edge Functions** → **Create a new function**
2. Name it: `reactivate-subscription`
3. Copy the code from `SETUP.md` (Function 5: reactivate-subscription)
4. Click **Deploy**

Or via CLI:

```bash
# Create the function file
mkdir -p supabase/functions/reactivate-subscription

# Copy the code from SETUP.md into:
# supabase/functions/reactivate-subscription/index.ts

# Deploy
supabase functions deploy reactivate-subscription
```

---

## Step 4: Set Environment Secrets (if not already set)

Make sure your Edge Functions have access to Stripe keys:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx  # or sk_test_xxx for testing
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Or in Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add/verify:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

---

## Step 5: Test the Migration

### Test 1: Verify Database Columns

```sql
-- Check that columns exist and have correct defaults
SELECT 
  id,
  email,
  subscription_status,
  cancel_at_period_end,
  canceled_at
FROM public.profiles
LIMIT 5;
```

### Test 2: Test Cancellation Flow

1. Log into your app with a test account that has an active subscription
2. Go to **Account** page
3. Click **Cancel Subscription**
4. Confirm cancellation
5. Verify:
   - Modal closes
   - "Cancellation pending" notice appears
   - Days remaining shows correctly
   - Reactivate button appears

### Test 3: Test Reactivation

1. Click **Reactivate Subscription**
2. Verify:
   - Success message appears
   - Cancellation notice disappears
   - Premium badge shows again

### Test 4: Test Trial Expiration

1. Create a test user with a trial that's about to expire (or manually set `trial_ends_at` in the past)
2. Try to access `/app`
3. Verify redirect to `/trial-expired` page
4. Test resubscription flow

---

## Step 6: Update Existing Subscriptions (Optional)

If you have existing active subscriptions, you may want to backfill the new fields:

```sql
-- This is optional - only needed if you want to sync existing data
-- Most subscriptions will update via webhook on next Stripe event

-- For existing active subscriptions, set defaults
UPDATE public.profiles
SET 
  cancel_at_period_end = FALSE,
  canceled_at = NULL
WHERE subscription_status = 'active'
AND (cancel_at_period_end IS NULL OR canceled_at IS NULL);
```

---

## Troubleshooting

### Issue: "Column already exists" error

**Solution:** The `IF NOT EXISTS` clause should prevent this, but if you see this error, the columns already exist. You can skip this step.

### Issue: Edge Function returns 401 Unauthorized

**Solution:** Make sure you're passing the `Authorization` header with the user's session token from the frontend.

### Issue: Cancellation not showing in UI

**Solution:** 
1. Check that `cancel_at_period_end` is being set to `true` in the database
2. Refresh the profile in AuthContext: `refreshProfile()`
3. Check browser console for errors

### Issue: Webhook not updating cancellation status

**Solution:**
1. Check Stripe Dashboard → **Webhooks** → **Events** for recent events
2. Check Supabase Edge Function logs for errors
3. Verify webhook secret is correct

---

## Checklist

- [ ] Migration SQL executed successfully
- [ ] New columns visible in database
- [ ] `stripe-webhook` function updated and deployed
- [ ] `cancel-subscription` function created and deployed
- [ ] `reactivate-subscription` function created and deployed
- [ ] Environment secrets configured
- [ ] Tested cancellation flow
- [ ] Tested reactivation flow
- [ ] Tested trial expiration redirect
- [ ] Verified webhook updates cancellation status

---

## Next Steps

After migration is complete:

1. **Monitor**: Watch for any errors in Edge Function logs
2. **Test**: Have a few test users try the cancellation flow
3. **Document**: Update your team on the new cancellation features
4. **Backup**: Consider backing up your database before major changes (Supabase does this automatically, but good practice)

---

## Rollback Plan (if needed)

If something goes wrong, you can rollback:

```sql
-- Remove the new columns (WARNING: This will lose cancellation data)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cancel_at_period_end;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS canceled_at;
```

However, the frontend code expects these fields, so you'd also need to revert the code changes.
