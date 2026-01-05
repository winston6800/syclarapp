<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Syclar - Social Confidence Coach

A premium coaching app to overcome social anxiety through daily action, accountability tracking, and AI-powered verification.

## 🚀 Quick Start

### Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   VITE_STRIPE_PRICE_ID=price_xxx
   GEMINI_API_KEY=your_gemini_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

### Deploy to Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

**Quick Vercel Deploy:**
1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide (Supabase + Stripe)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment & testing guide

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Auth & Database:** Supabase
- **Payments:** Stripe
- **AI:** Google Gemini
- **Deployment:** Vercel
