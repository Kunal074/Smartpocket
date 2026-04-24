# 💸 SplitEasy — Zero Cost Developer Blueprint

> **Stack: ₹0 to launch. UPI deeplink. No payment gateway.**  
> Splitkaro clone with fresh UI — built entirely on free tiers.

---

## 📌 Table of Contents

1. [Project Overview](#project-overview)
2. [Zero Cost Tech Stack](#zero-cost-tech-stack)
3. [UPI Deeplink Payment System](#upi-deeplink-payment-system)
4. [Supabase Setup (DB + Auth + Storage)](#supabase-setup)
5. [Database Schema](#database-schema)
6. [REST API Design](#rest-api-design)
7. [Authentication Flow (Firebase / Supabase)](#authentication-flow)
8. [Expense & Split Logic](#expense--split-logic)
9. [Debt Settlement Algorithm](#debt-settlement-algorithm)
10. [Screen-by-Screen UI Breakdown](#screen-by-screen-ui-breakdown)
11. [Push Notifications (Firebase FCM — Free)](#push-notifications)
12. [Analytics Module](#analytics-module)
13. [Folder Structure](#folder-structure)
14. [Environment Variables](#environment-variables)
15. [Deployment Guide (Free Hosting)](#deployment-guide)
16. [Testing Strategy](#testing-strategy)
17. [Standout Features to Add](#standout-features-to-add)
18. [Roadmap](#roadmap)

---

## 📋 Project Overview

**App Name:** SplitEasy  
**Tagline:** "Split smarter. Settle faster."  
**Platform:** Android (React Native / Expo) — iOS later  
**Backend:** Node.js + Express hosted on Railway/Render (free)  
**Database:** Supabase PostgreSQL (free)  
**Payments:** Native UPI deeplink — no gateway, no fees, no compliance  
**Total Launch Cost:** ₹0 (+ $25 one-time Play Store fee)

---

## 🆓 Zero Cost Tech Stack

### Complete Free Stack

| Layer | Tool | Free Limit | Why |
|-------|------|-----------|-----|
| **Database** | Supabase PostgreSQL | 500MB forever | Managed postgres, free |
| **Auth + OTP** | Supabase Auth | 50,000 MAU free | Phone OTP + Google built-in |
| **File Storage** | Supabase Storage | 1GB free | Receipts, avatars |
| **Backend Hosting** | Railway.app | $5 credit/month | Easy deploy, enough for MVP |
| **Alt Hosting** | Render.com | 750 hrs/month | Sleeps on idle, good backup |
| **Cache** | Upstash Redis | 10,000 req/day | Serverless Redis, free tier |
| **Push Notifs** | Firebase FCM | Unlimited free | Always free, no limits |
| **Email** | Resend.com | 3,000/month free | Modern API, easy setup |
| **Alt Email** | Brevo | 300/day free | Generous free tier |
| **Mobile** | Expo (React Native) | Free | EAS build has free tier |
| **Error Tracking** | Sentry | 5,000 errors/month | Free for small apps |
| **Analytics** | PostHog | 1M events/month | Free product analytics |
| **Payments** | Native UPI Deeplink | 100% free forever | No SDK, no fees, no compliance |
| **Domain** | Freenom / js.org | Free | Or buy .app for ~₹800/yr |

### What You Do NOT Need
- ❌ Razorpay — UPI deeplink replaces it for peer-to-peer
- ❌ Twilio paid plan — Supabase Auth handles OTP
- ❌ AWS S3 — Supabase Storage handles files
- ❌ SendGrid paid — Resend free tier is enough
- ❌ Any payment gateway — money flows peer-to-peer, you never touch it

---

## 💳 UPI Deeplink Payment System

This is the most important section. No Razorpay, no PhonePe SDK, no Paytm SDK needed.

### How It Works

```
User taps "Pay ₹300 to Rahul"
         │
         ▼
App fires UPI deeplink URL
         │
         ▼
Android shows UPI app picker
(GPay / PhonePe / Paytm / BHIM / all installed apps)
         │
         ▼
User picks their preferred app
         │
         ▼
Payment happens directly peer-to-peer
         │
         ▼
User returns to SplitEasy
         │
         ▼
"Mark as Settled?" prompt → user confirms
```

### UPI Deeplink URL Format

```javascript
// Basic format
upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE

// Real example
upi://pay?pa=rahul@okicici&pn=Rahul%20Sharma&am=300&cu=INR&tn=SplitEasy%20Settlement
```

### React Native Implementation

```javascript
// utils/upiHelper.js
import { Linking, Alert, Platform } from 'react-native';

export const settleViaUPI = async ({ upiId, amount, name, note }) => {
  if (Platform.OS !== 'android') {
    Alert.alert('UPI payments only work on Android');
    return;
  }

  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(note || 'SplitEasy Settlement');
  
  const upiUrl = [
    `upi://pay`,
    `?pa=${upiId}`,
    `&pn=${encodedName}`,
    `&am=${amount.toFixed(2)}`,
    `&cu=INR`,
    `&tn=${encodedNote}`,
  ].join('');

  const canOpen = await Linking.canOpenURL(upiUrl);
  
  if (canOpen) {
    await Linking.openURL(upiUrl);
    // Show "Mark as settled?" after redirect back
  } else {
    Alert.alert(
      'No UPI App Found',
      'Please install Google Pay, PhonePe, or Paytm to pay via UPI.',
      [{ text: 'OK' }]
    );
  }
};

// Usage in SettleUpScreen.js
const handleSettle = (settlement) => {
  settleViaUPI({
    upiId: settlement.recipient.upi_id,
    amount: settlement.amount,
    name: settlement.recipient.name,
    note: `SplitEasy - ${settlement.group_name}`,
  });
};
```

### Settlement Confirmation Flow

```javascript
// Since UPI doesn't give webhook (peer-to-peer),
// we use manual confirmation — same as Splitkaro free tier

// SettleUpScreen.jsx
const [showConfirm, setShowConfirm] = useState(false);

const onPayPress = async (settlement) => {
  await settleViaUPI(settlement);
  // After user comes back from UPI app:
  setShowConfirm(true);
};

// Confirm modal
<Modal visible={showConfirm}>
  <Text>Did the payment go through?</Text>
  <Button title="Yes, Mark as Settled" onPress={confirmSettlement} />
  <Button title="No, Cancel" onPress={() => setShowConfirm(false)} />
</Modal>
```

### UPI Apps Supported (Automatic — No Integration Needed)

All of these open automatically from the same deeplink:
- Google Pay (GPay)
- PhonePe
- Paytm
- BHIM
- Amazon Pay
- CRED Pay
- Axis Pay, HDFC PayZapp, SBI Pay, etc.

### User UPI ID Collection

```javascript
// In Profile Setup screen
// Ask user their UPI ID when they first register
// Store in users table: upi_id field

// Show UPI ID input with validation
const validateUPI = (upiId) => {
  // Format: something@bankhandle
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
  return regex.test(upiId);
};

// Common handles: @okicici, @oksbi, @okhdfcbank,
// @ybl (PhonePe), @paytm, @gpay, @apl (Amazon Pay)
```

---

## 🗄 Supabase Setup

Supabase replaces: PostgreSQL hosting + Auth + Storage + OTP. All free.

### Initial Setup

```bash
# 1. Go to supabase.com → Create new project
# 2. Get your project URL and anon key from Settings > API
# 3. Install Supabase client

npm install @supabase/supabase-js
```

### Supabase Client Config

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### Phone OTP Auth (Free — Built into Supabase)

```javascript
// Send OTP
const sendOTP = async (phone) => {
  const { error } = await supabase.auth.signInWithOtp({
    phone: `+91${phone}`,
  });
  if (error) throw error;
};

// Verify OTP
const verifyOTP = async (phone, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${phone}`,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
};
```

### Row Level Security (RLS)

```sql
-- Users can only read their own group data
CREATE POLICY "Users see own groups"
ON group_members FOR SELECT
USING (user_id = auth.uid());

-- Users can only see expenses in their groups
CREATE POLICY "Users see group expenses"
ON expenses FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members
    WHERE user_id = auth.uid()
  )
);
```

---

## 🗃 Database Schema

```sql
-- Run these in Supabase SQL Editor

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  avatar_url TEXT,
  upi_id VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'INR',
  is_premium BOOLEAN DEFAULT false,
  fcm_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'custom',
  -- trip | home | office | couple | business | personal | custom
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  cover_image_url TEXT,
  currency VARCHAR(10) DEFAULT 'INR',
  budget DECIMAL(12,2),
  created_by UUID REFERENCES users(id),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',
  nickname VARCHAR(100),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  category VARCHAR(50) DEFAULT 'other',
  split_type VARCHAR(20) DEFAULT 'equal',
  -- equal | percentage | exact | shares
  receipt_url TEXT,
  note TEXT,
  date DATE DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval VARCHAR(20),
  source VARCHAR(50) DEFAULT 'manual',
  -- manual | swiggy | zomato | blinkit | sms
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  shares INTEGER,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id),
  paid_by UUID REFERENCES users(id),
  paid_to UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'upi',
  upi_transaction_ref TEXT,
  note TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  -- pending | completed | cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  title VARCHAR(200),
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 REST API Design

### Base URL
```
https://your-app.railway.app/api/v1
```

### Auth Endpoints
```
POST  /auth/send-otp        → Send OTP via Supabase
POST  /auth/verify-otp      → Verify OTP, get session
POST  /auth/google          → Google sign-in
POST  /auth/logout          → Clear session
```

### User Endpoints
```
GET   /users/me             → Get profile
PUT   /users/me             → Update (name, UPI ID, avatar)
GET   /users/search?q=      → Search by phone
GET   /users/me/balances    → All pending balances
```

### Group Endpoints
```
GET   /groups               → List user groups
POST  /groups               → Create group
GET   /groups/:id           → Group details + members
PUT   /groups/:id           → Update group
DELETE /groups/:id          → Archive group
POST  /groups/:id/members   → Add member
DELETE /groups/:id/members/:uid → Remove member
GET   /groups/:id/balances  → Balance sheet
```

### Expense Endpoints
```
GET   /groups/:id/expenses  → List expenses (paginated)
POST  /groups/:id/expenses  → Create expense
GET   /expenses/:id         → Get expense
PUT   /expenses/:id         → Edit expense
DELETE /expenses/:id        → Delete expense
POST  /expenses/import-sms  → Auto-import from SMS
```

### Settlement Endpoints
```
POST  /settlements          → Record settlement
PUT   /settlements/:id      → Mark complete/cancel
GET   /groups/:id/settlements → Settlement history
```

### Analytics Endpoints
```
GET   /analytics/summary    → Overall stats
GET   /analytics/monthly    → Month-by-month
GET   /analytics/categories → Category breakdown
```

---

## 🔐 Authentication Flow

```
User opens SplitEasy
        │
        ▼
Enter phone number (+91XXXXXXXXXX)
        │
        ▼
supabase.auth.signInWithOtp({ phone })
→ Supabase sends OTP SMS for free
        │
        ▼
Enter 6-digit OTP
        │
        ▼
supabase.auth.verifyOtp({ phone, token })
        │
        ├── New user? → Profile Setup (name + UPI ID)
        │
        └── Existing? → Home Screen
              │
              ▼
        Session auto-managed by Supabase
        (stored in AsyncStorage on device)
```

---

## 💰 Expense & Split Logic

### Split Types

```javascript
// utils/splitCalculator.js

export function calculateSplits(expense) {
  const { amount, split_type, members } = expense;

  switch (split_type) {

    case 'equal': {
      const each = parseFloat((amount / members.length).toFixed(2));
      // Handle rounding remainder
      const total = each * members.length;
      const diff = parseFloat((amount - total).toFixed(2));
      return members.map((m, i) => ({
        user_id: m.id,
        amount: i === 0 ? each + diff : each,
      }));
    }

    case 'percentage': {
      // members[i].percentage must sum to 100
      const total = members.reduce((s, m) => s + m.percentage, 0);
      if (Math.abs(total - 100) > 0.01) throw new Error('Percentages must sum to 100');
      return members.map(m => ({
        user_id: m.id,
        amount: parseFloat(((amount * m.percentage) / 100).toFixed(2)),
        percentage: m.percentage,
      }));
    }

    case 'exact': {
      const total = members.reduce((s, m) => s + m.amount, 0);
      if (Math.abs(total - amount) > 0.01) throw new Error('Amounts must sum to total');
      return members.map(m => ({
        user_id: m.id,
        amount: parseFloat(m.amount.toFixed(2)),
      }));
    }

    case 'shares': {
      const totalShares = members.reduce((s, m) => s + m.shares, 0);
      return members.map(m => ({
        user_id: m.id,
        amount: parseFloat(((amount * m.shares) / totalShares).toFixed(2)),
        shares: m.shares,
      }));
    }

    default:
      throw new Error(`Unknown split type: ${split_type}`);
  }
}
```

---

## 🔢 Debt Settlement Algorithm

```javascript
// utils/debtSimplifier.js
// Minimum cash flow algorithm — reduces number of transactions

export function simplifyDebts(balances) {
  // balances = { userId: netAmount }
  // positive = owed money, negative = owes money

  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = parseFloat(balance.toFixed(2));
    if (rounded > 0.01)  creditors.push({ userId, amount: rounded });
    if (rounded < -0.01) debtors.push({ userId, amount: -rounded });
  }

  // Sort descending for efficiency
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor   = debtors[0];
    const amount   = parseFloat(Math.min(creditor.amount, debtor.amount).toFixed(2));

    transactions.push({
      from:   debtor.userId,
      to:     creditor.userId,
      amount,
    });

    creditor.amount = parseFloat((creditor.amount - amount).toFixed(2));
    debtor.amount   = parseFloat((debtor.amount   - amount).toFixed(2));

    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount   < 0.01) debtors.shift();
  }

  return transactions;
}

// Example usage:
// Input:  { alice: 900, bob: -300, charlie: -300, dave: -300 }
// Output: [ {from: bob, to: alice, amount: 300}, ... ]
```

---

## 📱 Screen-by-Screen UI Breakdown

### 1. Splash Screen
- Animated logo, gradient background (violet → pink)
- Auto-redirect after 1.5s

### 2. Onboarding (3 slides)
- Glassmorphism cards, swipeable
- "Split bills instantly", "Track group expenses", "Settle via UPI"

### 3. Phone Input
- Country picker (+91 default)
- Large number input
- "Get OTP" button

### 4. OTP Screen
- 6 individual digit boxes
- Auto-read SMS on Android
- 60s resend timer

### 5. Profile Setup (first time only)
- Name input
- Avatar (camera / gallery)
- UPI ID input (crucial for receiving payments)
- Validation: format check on UPI ID

### 6. Home Dashboard
- Balance summary: "You are owed ₹X" or "You owe ₹X"
- Quick actions: Add Expense | New Group | Settle Up
- Recent groups (horizontal scroll)
- Recent activity feed

### 7. Groups Screen
- Grid / list toggle
- Filter: All | Active | Archived
- Group card: name, member count, balance, last activity
- FAB to create group

### 8. Create Group Screen
- Type picker: Trip ✈️ | Home 🏠 | Office 💼 | Couple 💑 | Custom
- Name, color, icon
- Add members by phone search
- Optional budget limit

### 9. Group Detail Screen
- Tabs: Balances | Expenses | Settlements | Stats
- Balance tab: simplified "A owes B ₹X" list
- Each row has "Pay via UPI" button

### 10. Add Expense Screen
- Large amount input (centered)
- Title + smart suggestions
- Paid by selector
- Split type: Equal | % | Exact | Shares
- Category emoji picker
- Members checkboxes
- Receipt photo (stored in Supabase Storage)

### 11. Settle Up Screen
- Shows minimum transactions (debt simplified)
- Each row: [Payer] → [Receiver] ₹[Amount]
- "Pay via UPI" → fires deeplink → user picks GPay/PhonePe/Paytm
- "Mark as Settled" after returning from UPI app

### 12. Analytics Screen
- Month selector
- Total spent card
- Category donut chart
- Top expenses list
- Group-wise breakdown

### 13. Profile Screen
- Name, phone, avatar
- UPI ID (editable — important!)
- Dark mode toggle
- Notifications toggle
- Export data (CSV)
- Logout

---

## 🔔 Push Notifications (Firebase FCM — Free)

FCM is completely free with no limits.

### Setup

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### Get FCM Token

```javascript
// On app start
import messaging from '@react-native-firebase/messaging';

const getFCMToken = async () => {
  const authStatus = await messaging().requestPermission();
  const token = await messaging().getToken();
  
  // Save to Supabase users table
  await supabase
    .from('users')
    .update({ fcm_token: token })
    .eq('id', currentUserId);
    
  return token;
};
```

### Send Notification (Backend)

```javascript
// services/notification.service.js
const admin = require('firebase-admin');

const sendPush = async (fcmToken, { title, body, data }) => {
  await admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
    data: data || {},
    android: {
      priority: 'high',
      notification: { sound: 'default' },
    },
  });
};

// Usage examples
await sendPush(user.fcm_token, {
  title: 'New expense added',
  body: `Rahul added "Dinner ₹1200" in Goa Trip`,
  data: { type: 'expense_added', group_id: 'xxx' },
});

await sendPush(user.fcm_token, {
  title: 'Rahul settled up! ✅',
  body: 'Rahul paid you ₹300',
  data: { type: 'settlement_done' },
});
```

### Reminder Cron Job (Free on Railway)

```javascript
// cron.js — runs on your Railway backend
const cron = require('node-cron');

// Daily 9 AM IST reminder
cron.schedule('0 9 * * *', async () => {
  const usersWithBalance = await getUsersWithPendingBalance();
  
  for (const user of usersWithBalance) {
    if (!user.fcm_token) continue;
    await sendPush(user.fcm_token, {
      title: 'Pending dues reminder 💸',
      body: `You have ₹${user.total_owed} pending across ${user.group_count} groups`,
    });
  }
}, { timezone: 'Asia/Kolkata' });
```

---

## 📊 Analytics Module

### Metrics

| Metric | Query |
|--------|-------|
| Total spent (month) | SUM of expense_splits.amount WHERE user + month |
| You owe | SUM of unsettled splits WHERE you didn't pay |
| Owed to you | SUM of unsettled splits WHERE you paid |
| By category | GROUP BY category |
| By group | GROUP BY group_id |

### Supabase Query Example

```javascript
// Get monthly spending breakdown by category
const { data } = await supabase
  .from('expense_splits')
  .select(`
    amount,
    expenses!inner(category, date, group_id)
  `)
  .eq('user_id', userId)
  .gte('expenses.date', startOfMonth)
  .lte('expenses.date', endOfMonth);

// Group by category in JS
const byCategory = data.reduce((acc, row) => {
  const cat = row.expenses.category;
  acc[cat] = (acc[cat] || 0) + row.amount;
  return acc;
}, {});
```

---

## 📁 Folder Structure

```
spliteasy/
├── mobile/                       # Expo React Native
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Auth/
│   │   │   │   ├── PhoneScreen.jsx
│   │   │   │   ├── OTPScreen.jsx
│   │   │   │   └── ProfileSetupScreen.jsx
│   │   │   ├── Home/
│   │   │   │   └── HomeScreen.jsx
│   │   │   ├── Groups/
│   │   │   │   ├── GroupsScreen.jsx
│   │   │   │   ├── CreateGroupScreen.jsx
│   │   │   │   └── GroupDetailScreen.jsx
│   │   │   ├── Expenses/
│   │   │   │   ├── AddExpenseScreen.jsx
│   │   │   │   └── ExpenseDetailScreen.jsx
│   │   │   ├── Settlements/
│   │   │   │   └── SettleUpScreen.jsx
│   │   │   ├── Analytics/
│   │   │   │   └── AnalyticsScreen.jsx
│   │   │   └── Profile/
│   │   │       └── ProfileScreen.jsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Avatar.jsx
│   │   │   │   └── Input.jsx
│   │   │   ├── expense/
│   │   │   │   ├── ExpenseCard.jsx
│   │   │   │   └── SplitSelector.jsx
│   │   │   └── group/
│   │   │       ├── GroupCard.jsx
│   │   │       └── MemberList.jsx
│   │   ├── lib/
│   │   │   └── supabase.js           # Supabase client
│   │   ├── store/
│   │   │   ├── authStore.js          # Zustand
│   │   │   ├── groupStore.js
│   │   │   └── expenseStore.js
│   │   ├── utils/
│   │   │   ├── splitCalculator.js
│   │   │   ├── debtSimplifier.js
│   │   │   ├── upiHelper.js          # UPI deeplink
│   │   │   └── smsParser.js          # Swiggy/Zomato import
│   │   └── theme/
│   │       ├── colors.js
│   │       ├── typography.js
│   │       └── spacing.js
│   ├── app.json
│   └── package.json
│
└── backend/                       # Node.js on Railway
    ├── src/
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── user.routes.js
    │   │   ├── group.routes.js
    │   │   ├── expense.routes.js
    │   │   ├── settlement.routes.js
    │   │   └── analytics.routes.js
    │   ├── controllers/
    │   ├── middleware/
    │   │   ├── auth.middleware.js    # Verify Supabase JWT
    │   │   └── rateLimit.middleware.js
    │   ├── services/
    │   │   ├── notification.service.js  # FCM
    │   │   └── cron.service.js          # Reminders
    │   └── lib/
    │       └── supabase.js              # Supabase admin client
    ├── .env
    └── package.json
```

---

## 🔧 Environment Variables

### Mobile App (.env)
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### Backend (.env)
```env
# App
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT (from Supabase Settings > API > JWT Secret)
SUPABASE_JWT_SECRET=your_jwt_secret

# Firebase (for FCM push)
FIREBASE_PROJECT_ID=spliteasy-app
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Cache
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=your_token

# Email
RESEND_API_KEY=re_xxxx

# Cron timezone
TZ=Asia/Kolkata
```

---

## 🚀 Deployment Guide (Free)

### Backend on Railway (Free)

```bash
# 1. Push code to GitHub

# 2. Go to railway.app → New Project → Deploy from GitHub

# 3. Add environment variables in Railway dashboard

# 4. Railway auto-deploys on every git push

# Custom domain: railway gives you a free .railway.app domain
```

### Backend on Render (Free Alternative)

```bash
# 1. Go to render.com → New Web Service → Connect GitHub

# 2. Build command: npm install && npm run build
# 3. Start command: npm start

# Note: Free tier sleeps after 15 min of inactivity
# Add a health-check ping every 10 min to keep it awake
# Use: cron-job.org (free) to ping /health every 10 min
```

### Mobile App (Expo EAS Free Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build Android APK (free tier: 30 builds/month)
eas build --platform android --profile preview

# Build production AAB for Play Store
eas build --platform android --profile production

# Download APK and test
# OR submit directly:
eas submit --platform android
```

### Supabase (Zero Config)

```bash
# Already hosted at supabase.com
# Just run migrations in SQL Editor
# Enable Row Level Security
# Configure Auth → Phone → Enable
# Configure Storage → Create 'receipts' bucket
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test split calculator
jest src/utils/splitCalculator.test.js

# Test debt simplifier
jest src/utils/debtSimplifier.test.js

# Test UPI URL builder
jest src/utils/upiHelper.test.js
```

### Example Test

```javascript
// splitCalculator.test.js
import { calculateSplits } from './splitCalculator';

test('equal split of 1200 among 4', () => {
  const splits = calculateSplits({
    amount: 1200,
    split_type: 'equal',
    members: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
  });
  expect(splits).toHaveLength(4);
  splits.forEach(s => expect(s.amount).toBeCloseTo(300, 2));
});

test('UPI URL is correctly formed', () => {
  const url = buildUPIUrl({ upiId: 'rahul@okicici', amount: 300, name: 'Rahul' });
  expect(url).toContain('pa=rahul@okicici');
  expect(url).toContain('am=300');
  expect(url).toContain('cu=INR');
});
```

---

## ⭐ Standout Features to Add

### Phase 1 — High Impact, Zero Cost
- **AI Receipt Scanner** — use Google ML Kit (free) to OCR receipt photos
- **Bank SMS Auto-Import** — parse SMS on Android, suggest adding as expense
- **Voice Add Expense** — use device's built-in speech-to-text (free)
- **Trip Summary Card** — beautiful auto-generated shareable image on group close

### Phase 2 — Social & Viral
- **Expense Reactions** — emoji reactions on expenses (😂 for silly bills)
- **Group Leaderboard** — "Biggest spender", "Most generous" badges
- **WhatsApp Share** — share expense summary to WhatsApp group

### Phase 3 — Power Features
- **Full Offline Mode** — MMKV local storage + background sync
- **Fairness Score** — per-group score tracking how even splits are
- **Recurring Expenses** — monthly rent, Netflix splits, etc.
- **Dispute & Contest** — flag a split you disagree with

---

## 🗺 Roadmap

### v1.0 — MVP (Week 1-6)
- [x] Phone OTP login (Supabase)
- [x] Create groups
- [x] Add expenses (equal + percentage split)
- [x] View balance sheet
- [x] UPI deeplink settle up
- [x] Push notifications (FCM)
- [x] Basic analytics

### v1.5 — Growth (Week 7-12)
- [ ] Exact + Shares split modes
- [ ] SMS auto-import (Swiggy/Zomato)
- [ ] Receipt photo upload (Supabase Storage)
- [ ] Dark mode
- [ ] Export CSV
- [ ] Trip summary shareable card

### v2.0 — Scale (Month 4-6)
- [ ] Recurring expenses
- [ ] Budget limits
- [ ] Advanced analytics
- [ ] Offline mode
- [ ] AI receipt scanner (Google ML Kit)
- [ ] WhatsApp bot

### v3.0 — Monetize
- [ ] Premium plan via Google Play Billing
- [ ] Unlimited groups for free, premium = analytics + export
- [ ] Team premium

---

## 💰 True Cost Breakdown

| Item | Cost |
|------|------|
| Supabase (DB + Auth + Storage) | ₹0 |
| Railway hosting | ₹0 (free tier) |
| Firebase FCM push | ₹0 |
| Resend email | ₹0 |
| UPI payments | ₹0 |
| Expo builds | ₹0 (30/month free) |
| Domain (optional) | ~₹800/year |
| Google Play Store | $25 one-time (~₹2,100) |
| **Total to launch** | **~₹2,100 one-time** |

---

*Built with ❤️ — SplitEasy. ₹0 to start. Unlimited potential.*
