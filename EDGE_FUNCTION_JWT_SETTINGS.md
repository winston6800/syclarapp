# Edge Function JWT Verification Settings

## Quick Answer

**Only the `stripe-webhook` function should have JWT verification DISABLED.**

All other functions called by your frontend should have JWT verification ENABLED (default).

---

## Function-by-Function Breakdown

### ✅ JWT Verification REQUIRED (Default - Keep Enabled)

These functions are called by authenticated users from your frontend:

1. **`create-checkout-session`** 
   - Called by: Frontend (authenticated users)
   - JWT: **ENABLED** ✅
   - Why: Only authenticated users should create checkout sessions

2. **`create-portal-session`**
   - Called by: Frontend (authenticated users)
   - JWT: **ENABLED** ✅
   - Why: Only authenticated users should access billing portal

3. **`cancel-subscription`**
   - Called by: Frontend (authenticated users)
   - JWT: **ENABLED** ✅
   - Why: Only authenticated users should cancel their own subscriptions

4. **`reactivate-subscription`**
   - Called by: Frontend (authenticated users)
   - JWT: **ENABLED** ✅
   - Why: Only authenticated users should reactivate their own subscriptions

### ❌ JWT Verification DISABLED

1. **`stripe-webhook`**
   - Called by: Stripe (external service)
   - JWT: **DISABLED** ❌
   - Why: Stripe doesn't have user JWT tokens - it uses webhook signatures instead
   - Security: Protected by Stripe webhook signature verification

---

## How to Configure JWT Verification in Supabase

### Via Supabase Dashboard:

1. Go to **Edge Functions** in your Supabase project
2. Click on a function (e.g., `stripe-webhook`)
3. Go to **Settings** tab
4. Find **"Verify JWT"** toggle
5. **Disable it ONLY for `stripe-webhook`**
6. **Keep it ENABLED for all other functions**

### Via Supabase CLI (deno.json):

If you're using CLI, you can configure this in each function's `deno.json`:

**For stripe-webhook (JWT disabled):**
```json
{
  "verify_jwt": false
}
```

**For other functions (JWT enabled - default):**
```json
{
  "verify_jwt": true
}
```

Or simply omit the setting (defaults to `true`).

---

## Security Notes

### Why JWT Verification Matters:

- **Prevents unauthorized access**: Only authenticated users can call protected functions
- **User context**: Functions can verify which user is making the request
- **Rate limiting**: Can be tied to specific users

### Why Webhook Doesn't Need JWT:

- **Stripe signature verification**: The webhook uses Stripe's signature to verify authenticity
- **No user context**: Webhooks are system-to-system, not user-initiated
- **Different security model**: Webhook secret is the authentication mechanism

---

## Verification Checklist

After deployment, verify:

- [ ] `stripe-webhook` has JWT verification **DISABLED**
- [ ] `create-checkout-session` has JWT verification **ENABLED**
- [ ] `create-portal-session` has JWT verification **ENABLED**
- [ ] `cancel-subscription` has JWT verification **ENABLED**
- [ ] `reactivate-subscription` has JWT verification **ENABLED**

---

## Testing

### Test JWT-Protected Functions:

Try calling a protected function without a JWT token:
```bash
curl https://your-project.supabase.co/functions/v1/cancel-subscription \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId": "test"}'
```

**Expected**: 401 Unauthorized (if JWT is enabled ✅)

### Test Webhook (No JWT):

The webhook should work when called by Stripe with proper signature, but fail if signature is invalid.

---

## Common Issues

### Issue: "Unauthorized" when calling webhook
**Solution**: Make sure JWT verification is **DISABLED** for `stripe-webhook`

### Issue: Anyone can call cancel-subscription
**Solution**: Make sure JWT verification is **ENABLED** for `cancel-subscription`

### Issue: Frontend gets 401 when calling functions
**Solution**: Make sure you're passing the `Authorization` header with the user's session token:
```typescript
headers: {
  'Authorization': `Bearer ${session.access_token}`,
  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
}
```
