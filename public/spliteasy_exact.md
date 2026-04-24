# SplitEasy Developer Guide (Exact Conversion)

SplitEasy — Developer Blueprint

spliteasy.app

n SplitEasy

Splitkaro Clone — Full Developer Guide

A to Z working blueprint with screens, APIs,
database schema, algorithms & deployment.

40+

Features

28

8

API Endpoints

DB Tables

15+

Screens

React Native

Node.js

PostgreSQL

Redis

UPI

Razorpay

n Table of Contents

1. Project Overview & Architecture

2. Tech Stack

3. Database Schema (All Tables)

4. REST API Endpoints

5. Authentication Flow

6. Expense & Split Logic

7. Debt Settlement Algorithm

8. Screen-by-Screen UI Breakdown

9. Notification & Reminder System

10. UPI & Payment Integration

© 2024 SplitEasy. Confidential & Proprietary.

Page 1

SplitEasy — Developer Blueprint

spliteasy.app

11. Analytics Module

12. Folder Structure

13. Environment Variables

14. Deployment Guide

15. Testing Strategy

16. Roadmap & Feature Checklist

© 2024 SplitEasy. Confidential & Proprietary.

Page 2

SplitEasy — Developer Blueprint

spliteasy.app

n 1. Project Overview & Architecture

What is SplitEasy?

SplitEasy is a full-featured bill splitting and group expense management app — a fresh clone of Splitkaro with a

redesigned glassmorphism + neumorphism UI. It allows users to create groups, add shared expenses, split bills

in multiple ways, settle debts via UPI, and analyze spending patterns with beautiful charts.

Property

App Name

Tagline

Platform

Backend

Value

SplitEasy

"Split smarter. Settle faster."

Android + iOS (React Native) + Web (React.js)

Node.js + Express + PostgreSQL + Redis

Target Users

Friends, Flatmates, Couples, Travel Groups, Office Teams

Monetization

Freemium — Individual & Team Premium Plans

Version

v1.0 MVP

System Architecture

nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
n           CLIENT LAYER                      n
n   React Native (Mobile) + React.js (Web)    n
nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
               n  HTTPS / WebSocket
nnnnnnnnnnnnnnntnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
n           API GATEWAY                       n
n       Express.js REST API + JWT Auth        n
nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
n  Auth | Groups | Expenses | Pay | Analytics n
nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
       n          n          n
nnnnnnntnnnnnnnnnntnnnnnnnnnntnnnnnnnnnnnnnnnnn
n     PostgreSQL (Primary) + Redis (Cache)    n
nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn

© 2024 SplitEasy. Confidential & Proprietary.

Page 3

SplitEasy — Developer Blueprint

spliteasy.app

n 2. Tech Stack

Mobile (React Native)

Layer

Framework

Technology

React Native (Expo SDK 51)

State Management

Zustand + React Query v5

Navigation

Charts

Local Storage

Push Notifications

OTP / Auth

Backend (Node.js)

Layer

Runtime

Framework

ORM

Primary DB

Cache

Auth

File Storage

OTP Provider

Push Notifications

Payments

Email

Web (React)

Layer

React Navigation v6

Victory Native

MMKV (fast key-value)

Expo Notifications + FCM

Google Sign-In + Phone Auth

Technology

Node.js 20 LTS

Express.js 4.x

Prisma 5.x

PostgreSQL 15

Redis 7

JWT + Refresh Tokens

AWS S3 / Cloudflare R2

MSG91 / Twilio

Firebase FCM

Razorpay / PhonePe SDK

SendGrid

Technology

© 2024 SplitEasy. Confidential & Proprietary.

Page 4

SplitEasy — Developer Blueprint

spliteasy.app

Framework

State

UI

Charts

React.js 18 + Vite

Redux Toolkit

Tailwind CSS + Custom Design System

Recharts

© 2024 SplitEasy. Confidential & Proprietary.

Page 5

SplitEasy — Developer Blueprint

spliteasy.app

n 3. Database Schema

Table: users

CREATE TABLE users (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  phone VARCHAR(15) UNIQUE NOT NULL,

  name VARCHAR(100),

  email VARCHAR(255) UNIQUE,

  avatar_url TEXT,

  upi_id VARCHAR(100),

  currency VARCHAR(10) DEFAULT 'INR',

  is_premium BOOLEAN DEFAULT false,

  premium_expires_at TIMESTAMP,

  fcm_token TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);

Table: groups

CREATE TABLE groups (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL,

  type VARCHAR(50) DEFAULT 'custom',

    -- trip, home, office, couple, business, personal, custom,

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

Table: group_members

CREATE TABLE group_members (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,

  user_id UUID REFERENCES users(id),

  role VARCHAR(20) DEFAULT 'member'  -- admin, member,

  nickname VARCHAR(100),

  joined_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(group_id, user_id)

);

© 2024 SplitEasy. Confidential & Proprietary.

Page 6

SplitEasy — Developer Blueprint

spliteasy.app

Table: expenses

CREATE TABLE expenses (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,

  paid_by UUID REFERENCES users(id),

  title VARCHAR(200) NOT NULL,

  amount DECIMAL(12,2) NOT NULL,

  currency VARCHAR(10) DEFAULT 'INR',

  category VARCHAR(50),

    -- food, travel, accommodation, shopping, entertainment,

  split_type VARCHAR(20) DEFAULT 'equal',

    -- equal, percentage, exact, shares,

  receipt_url TEXT,

  note TEXT,

  date DATE DEFAULT CURRENT_DATE,

  is_recurring BOOLEAN DEFAULT false,

  recurrence_interval VARCHAR(20)  -- daily, weekly, monthly,

  source VARCHAR(50) DEFAULT 'manual',

    -- manual, swiggy, zomato, blinkit, sms,

  created_at TIMESTAMP DEFAULT NOW()

);

Table: expense_splits

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

Table: settlements

© 2024 SplitEasy. Confidential & Proprietary.

Page 7

SplitEasy — Developer Blueprint

spliteasy.app

CREATE TABLE settlements (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id UUID REFERENCES groups(id),

  paid_by UUID REFERENCES users(id),

  paid_to UUID REFERENCES users(id),

  amount DECIMAL(12,2) NOT NULL,

  payment_method VARCHAR(30),

    -- upi, cash, bank_transfer,

  upi_transaction_id VARCHAR(100),

  status VARCHAR(20) DEFAULT 'pending',

    -- pending, completed, failed,

  created_at TIMESTAMP DEFAULT NOW(),

  completed_at TIMESTAMP

);

Table: notifications

CREATE TABLE notifications (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES users(id),

  type VARCHAR(50)  -- expense_added, settlement_done, reminder,

  title VARCHAR(200),

  body TEXT,

  data JSONB,

  is_read BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW()

);

© 2024 SplitEasy. Confidential & Proprietary.

Page 8

SplitEasy — Developer Blueprint

spliteasy.app

n 4. REST API Endpoints

Base URL: https://api.spliteasy.app/v1

n Auth Endpoints

Method

Endpoint

Description

POST

POST

POST

POST

POST

/auth/send-otp

Send OTP to phone number

/auth/verify-otp

Verify OTP, receive JWT

/auth/google

/auth/refresh

/auth/logout

Google OAuth sign-in

Refresh access token

Logout & invalidate token

n Users Endpoints

Method

Endpoint

/users/me

/users/me

GET

PUT

GET

GET

Description

Get current user profile

Update profile (name, avatar, UPI)

/users/search

Search users by phone number

/users/me/balances

All pending balances across groups

n Groups Endpoints

Method

Endpoint

Description

GET

/groups

POST

/groups

GET

PUT

/groups/:id

/groups/:id

List all user's groups

Create a new group

Get single group details

Update group info

DELETE

/groups/:id

Archive or delete group

POST

/groups/:id/members

Add member to group

DELETE

/groups/:id/members/:uid

Remove member

GET

/groups/:id/balances

Balance sheet for group

POST

/groups/:id/settle

Mark all balances as settled

© 2024 SplitEasy. Confidential & Proprietary.

Page 9

SplitEasy — Developer Blueprint

spliteasy.app

n Expenses Endpoints

Method

Endpoint

Description

GET

/groups/:id/expenses

List group expenses (paginated)

POST

/groups/:id/expenses

Create new expense

GET

PUT

/expenses/:id

/expenses/:id

DELETE

/expenses/:id

Get single expense

Edit expense

Delete expense

POST

/expenses/import-sms

Import expense from SMS text

n Settlements Endpoints

Method

Endpoint

Description

POST

/settlements

Record a new settlement

PUT

GET

/settlements/:id

Confirm or cancel settlement

/groups/:id/settlements

List settlements for group

n Analytics Endpoints

Method

Endpoint

Description

GET

GET

GET

GET

/analytics/summary

Overall spending summary

/analytics/groups/:id

Group-level analytics

/analytics/categories

Breakdown by category

/analytics/monthly

Month-by-month spending trends

© 2024 SplitEasy. Confidential & Proprietary.

Page 10

SplitEasy — Developer Blueprint

spliteasy.app

n 5. Authentication Flow

SplitEasy  uses  phone-number  based  OTP  authentication  as  the  primary  login  method,  with  optional  Google

Sign-In.  JWT  access  tokens  expire  in  24  hours,  while  refresh  tokens  last  30  days  and  are  stored  securely  in

MMKV on device.

User opens app
      n
      t
Enter phone number (with country picker)
      n
      t
POST /auth/send-otp ﬁ MSG91 / Twilio sends 6-digit OTP
      n
      t
Enter 6-digit OTP (auto-read on Android)
      n
      t
POST /auth/verify-otp
      n
      nnn New user? ﬁ Profile Setup Screen
      n              (enter name, avatar, optional email)
      n
      nnn Existing user? ﬁ Home Screen
                n
                t
         Store JWT + Refresh Token (MMKV)
                n
                t
         Auto-refresh token every 23 hours

JWT Token Structure

// Access Token Payload

{

  "sub": "user-uuid",

  "phone": "+919876543210",

  "name": "Rahul Sharma",

  "is_premium": false,

  "iat": 1710000000,

  "exp": 1710086400   // 24 hours

}

// Refresh Token: stored in DB, 30-day expiry
// On expiry: auto-silent refresh ﬁ new access token

© 2024 SplitEasy. Confidential & Proprietary.

Page 11

SplitEasy — Developer Blueprint

spliteasy.app

n 6. Expense & Split Logic

SplitEasy supports four split modes. The split logic runs on the backend when an expense is saved, generating

individual expense_splits rows for each member.

Mode

Description

Equal Split

Divide total equally among all selected members.

Percentage Split

Each member pays a defined % of the total.

Exact Amount Split

Each member owes a specific fixed amount.

Shares Split

Assign shares (weights) to each member; amounts are proportional.

Split Calculation Code (JavaScript)

function calculateSplits(expense) {

  const { amount, split_type, members } = expense;

  const splits = [];

  if (split_type === 'equal') {

    const each = amount / members.length;

    members.forEach(m => splits.push({ user_id: m.id, amount: each }));

  } else if (split_type === 'percentage') {

    members.forEach(m => {

      splits.push({ user_id: m.id, amount: (amount * m.percentage) / 100 });

    });

  } else if (split_type === 'exact') {

    // Validate sum equals total

    const total = members.reduce((s, m) => s + m.amount, 0);

    if (Math.abs(total - amount) > 0.01) throw new Error('Sum mismatch');

    members.forEach(m => splits.push({ user_id: m.id, amount: m.amount }));

  } else if (split_type === 'shares') {

    const totalShares = members.reduce((s, m) => s + m.shares, 0);

    members.forEach(m => {

      splits.push({ user_id: m.id, amount: (amount * m.shares) / totalShares });

    });

  }

  return splits;

}

© 2024 SplitEasy. Confidential & Proprietary.

Page 12

SplitEasy — Developer Blueprint

spliteasy.app

n 7. Debt Settlement Algorithm

SplitEasy uses the Minimum Cash Flow algorithm to simplify debts. Instead of showing every individual IOU, it

computes the minimum number of transactions to settle all balances within a group.

Scenario

Result

Alice paid n1200 dinner (4 people equal)

Bob, Charlie, Dave each owe Alice n300

Bob paid n800 cab (4 people equal)

Alice, Charlie, Dave each owe Bob n200

Net: Alice is owed n100, Bob is owed n100

Charlie owes n100, Dave owes n100

Simplified: Charlie ﬁ Alice n100

Dave ﬁ Bob n100 (2 transactions total)

Algorithm Implementation

© 2024 SplitEasy. Confidential & Proprietary.

Page 13

SplitEasy — Developer Blueprint

spliteasy.app

function simplifyDebts(balances) {

  // balances = { userId: netBalance }

  // +ve = owed money,  -ve = owes money

  const creditors = [];  // people owed money

  const debtors = [];    // people who owe money

  for (const [userId, balance] of Object.entries(balances)) {

    if (balance > 0.01)  creditors.push({ userId, amount: balance });

    if (balance < -0.01) debtors.push({ userId, amount: -balance });

  }

  const transactions = [];

  while (creditors.length > 0 && debtors.length > 0) {

    const creditor = creditors[0];

    const debtor   = debtors[0];

    const amount   = Math.min(creditor.amount, debtor.amount);

    transactions.push({

      from:   debtor.userId,

      to:     creditor.userId,

      amount: parseFloat(amount.toFixed(2)),

    });

    creditor.amount -= amount;

    debtor.amount   -= amount;

    if (creditor.amount < 0.01) creditors.shift();

    if (debtor.amount   < 0.01) debtors.shift();

  }

  return transactions;

  // Returns minimum transactions to clear all group debts

}

© 2024 SplitEasy. Confidential & Proprietary.

Page 14

SplitEasy — Developer Blueprint

spliteasy.app

n 8. Screen-by-Screen UI Breakdown

Splash Screen

F Animated logo with gradient (violet ﬁ pink)

F Tagline: 'Split smarter. Settle faster.'

F Auto-navigate to Home or Onboarding after 1.5s

Onboarding (3 slides)

F Slide 1: 'Create groups in seconds'

F Slide 2: 'Split any way you want'

F Slide 3: 'Settle via UPI instantly'

F Glassmorphism cards, skip button, dot indicators

Phone Input Screen

F Country code picker (+91 default)

F Large phone number input field

F Terms of service checkbox

F Animated 'Get OTP' button

OTP Verification

F 6 individual digit input boxes

F Auto-read SMS on Android (READ_SMS permission)

F 60s countdown timer with resend option

F Haptic feedback on correct entry

Home Dashboard

F Top: Avatar + greeting + notification bell

F Balance summary card (owed / owe with color)

F Quick Actions: Add Expense | Settle | New Group

F Recent groups horizontal scroll

F Activity feed (latest 10 transactions)

Groups Screen

F Grid / List toggle view

F Cards: name, members, your balance, last activity

© 2024 SplitEasy. Confidential & Proprietary.

Page 15

SplitEasy — Developer Blueprint

spliteasy.app

F Filter tabs: All | Active | Archived

F FAB (+) to create new group

Group Detail

F Header: Cover image + name + member avatars

F Tab 1 - Balances: Who owes whom

F Tab 2 - Expenses: Chronological list

F Tab 3 - Settlements: Payment history

F Tab 4 - Stats: Pie chart + totals

F FAB: Add Expense

Add Expense Screen

F Large centered amount input

F Title with smart suggestions (Dinner, Cab, Groceries...)

F Paid by selector (self or member)

F Split type toggle: Equal | % | Exact | Shares

F Category emoji picker

F Date picker + note + receipt photo

F Member inclusion checkboxes

Settle Up Screen

F Shows minimum transactions (simplified debts)

F Each row: Payer ﬁ Receiver + Amount

F UPI Pay button (opens native UPI intent)

F Mark as Settled (manual confirmation)

F Settlement confirmation animation

Analytics Screen

F Month selector (prev/next arrow)

F Total spent hero card

F Category donut chart (interactive)

F Group-wise bar chart

F Top 5 expenses list

F Monthly trend line chart

© 2024 SplitEasy. Confidential & Proprietary.

Page 16

SplitEasy — Developer Blueprint

spliteasy.app

n 9. Notification & Reminder System

Notification Types

Type

Trigger

expense_added

New expense in group

expense_edited

Expense modified

settlement_done

Someone settled up

reminder

Pending dues (daily 9 AM)

group_invite

Added to a group

Channel

Push + In-app

Push + In-app

Push + In-app

Push + SMS

Push + SMS

budget_alert

Group hits 80% of budget

Push + In-app

recurring_expense

Recurring bill due

Push + In-app

Reminder Schedule Logic

// Daily reminder cron job (runs at 9:00 AM IST)

cron.schedule('0 9 * * *', async () => {

  const usersWithBalance = await getUsersWithPendingBalance();

  for (const user of usersWithBalance) {

    await sendPushNotification(user.fcm_token, {

      title: 'Pending dues reminder',
      body: `You have n${user.totalOwed} pending across ${user.groupCount} groups`,
    });

    // If no action in 3 days ﬁ SMS
    if (user.lastReminderDaysAgo >= 3) {
      await sendSMS(user.phone, `Hi ${user.name}, you owe n${user.totalOwed}`);
    }

  }

}, { timezone: 'Asia/Kolkata' });

// Weekly summary every Sunday 6 PM IST

cron.schedule('0 18 * * 0', sendWeeklySummary, { timezone: 'Asia/Kolkata' });

© 2024 SplitEasy. Confidential & Proprietary.

Page 17

SplitEasy — Developer Blueprint

spliteasy.app

n 10. UPI & Payment Integration

Android UPI Intent (Direct)

// Opens the UPI app picker on Android

const initiateUPIPayment = (upiId, amount, name, note) => {

  const upiUrl = [

    `upi://pay?pa=${encodeURIComponent(upiId)}`,

    `&pn;=${encodeURIComponent(name)}`,

    `&am;=${amount}`,

    `&cu;=INR`,

    `&tn;=${encodeURIComponent(note)}`,

  ].join('');

  Linking.canOpenURL(upiUrl).then(supported => {

    if (supported) Linking.openURL(upiUrl);

    else Alert.alert('No UPI app found', 'Please install a UPI app');

  });

};

Razorpay Integration

const payWithRazorpay = async (settlementId, amount, recipientUpiId) => {

  // 1. Create order on backend

  const order = await api.post('/settlements/create-order', {

    settlement_id: settlementId, amount,

  });

  // 2. Open Razorpay checkout

  const options = {

    description: 'Expense Settlement via SplitEasy',

    currency: 'INR',

    key: RAZORPAY_KEY_ID,

    amount: amount * 100,  // in paise

    name: 'SplitEasy',

    order_id: order.data.id,

    prefill: { contact: user.phone, name: user.name },

    theme: { color: '#6C63FF' },

  };

  RazorpayCheckout.open(options)

    .then(data => {

      // 3. Confirm settlement on backend

      api.put(`/settlements/${settlementId}`, {

        status: 'completed',

        upi_transaction_id: data.razorpay_payment_id,

      });

    })

    .catch(err => console.log('Payment failed:', err));

};

© 2024 SplitEasy. Confidential & Proprietary.

Page 18

SplitEasy — Developer Blueprint

spliteasy.app

n 11. Analytics Module

Metrics Tracked

Metric

Description

Period

Total Spent

Sum of all expenses where user is included

All Time / Monthly

Amount Owed

Sum of pending splits where user owes

Amount Owed to You

Sum of pending splits where others owe user

Category Breakdown

% spent per category (food, travel, etc.)

Top Groups

Groups by total spend

Monthly Trend

Month-by-month spending line chart

Fairness Score

How evenly expenses are shared in group

Real-time

Real-time

Monthly

All time

12 months

Per group

Category Icons & Labels

n Food & Dining

(n Travel

n Accommodation

n Shopping

n Healthcare

n Gifts

n Entertainment

n Subscriptions

n Business

n Utilities

n Education

n Other

© 2024 SplitEasy. Confidential & Proprietary.

Page 19

SplitEasy — Developer Blueprint

spliteasy.app

n 12. Folder Structure

spliteasy/
nnn mobile/                     # React Native (Expo)
n   nnn src/
n   n   nnn screens/
n   n   n   nnn Auth/           # OTP, Profile Setup
n   n   n   nnn Home/           # Dashboard
n   n   n   nnn Groups/         # List + Create
n   n   n   nnn GroupDetail/    # Expenses, Balances, Stats
n   n   n   nnn Expenses/       # Add, Edit expense
n   n   n   nnn Settlements/    # Settle up flow
n   n   n   nnn Analytics/      # Charts & Insights
n   n   n   nnn Profile/        # Settings, Premium
n   n   nnn components/
n   n   n   nnn common/         # Button, Card, Input, Avatar
n   n   n   nnn expense/        # ExpenseCard, SplitSelector
n   n   n   nnn group/          # GroupCard, MemberList
n   n   n   nnn charts/         # DonutChart, BarChart
n   n   nnn store/              # Zustand stores
n   n   n   nnn authStore.js
n   n   n   nnn groupStore.js
n   n   n   nnn expenseStore.js
n   n   nnn api/                # React Query hooks
n   n   n   nnn useGroups.js
n   n   n   nnn useExpenses.js
n   n   n   nnn useAnalytics.js
n   n   nnn utils/
n   n   n   nnn splitCalculator.js
n   n   n   nnn debtSimplifier.js
n   n   n   nnn smsParser.js
n   n   n   nnn upiHelper.js
n   n   nnn theme/              # Colors, fonts, spacing
n   nnn app.json
n
nnn backend/                    # Node.js + Express
n   nnn src/
n   n   nnn routes/             # Express route files
n   n   nnn controllers/        # Business logic
n   n   nnn middleware/         # Auth, validation, rate-limit
n   n   nnn services/           # Notification, Payment, SMS
n   n   nnn prisma/             # schema.prisma + migrations
n   n   nnn utils/              # Helpers, constants
n   nnn .env
n   nnn package.json
n
nnn web/                        # React.js (Vite)
    nnn src/
    n   nnn pages/
    n   nnn components/
    n   nnn store/
    n   nnn api/
    nnn package.json

© 2024 SplitEasy. Confidential & Proprietary.

Page 20

SplitEasy — Developer Blueprint

spliteasy.app

n 13. Environment Variables

# nn App nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
NODE_ENV=production

PORT=3000

APP_URL=https://api.spliteasy.app

# nn Database nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
DATABASE_URL=postgresql://user:pass@host:5432/spliteasy

REDIS_URL=redis://localhost:6379

# nn JWT nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
JWT_SECRET=your_super_secret_key_here

JWT_REFRESH_SECRET=your_refresh_secret_here

JWT_EXPIRES_IN=24h

JWT_REFRESH_EXPIRES_IN=30d

# nn OTP Providers nnnnnnnnnnnnnnnnnnnnnnnnnnnnn
MSG91_API_KEY=your_msg91_key

MSG91_TEMPLATE_ID=your_template_id

TWILIO_SID=your_twilio_sid

TWILIO_AUTH_TOKEN=your_token

TWILIO_PHONE=+1234567890

# nn File Storage (S3 / R2) nnnnnnnnnnnnnnnnnnnn
AWS_ACCESS_KEY=your_aws_key

AWS_SECRET_KEY=your_aws_secret

AWS_BUCKET=spliteasy-uploads

AWS_REGION=ap-south-1

# nn Payments nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
RAZORPAY_KEY_ID=rzp_live_xxx

RAZORPAY_KEY_SECRET=your_razorpay_secret

# nn Firebase (FCM Push) nnnnnnnnnnnnnnnnnnnnnnn
FIREBASE_PROJECT_ID=spliteasy-app

FIREBASE_PRIVATE_KEY=your_firebase_private_key

# nn Email nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn
SENDGRID_API_KEY=SG.xxxxx

FROM_EMAIL=noreply@spliteasy.app

© 2024 SplitEasy. Confidential & Proprietary.

Page 21

SplitEasy — Developer Blueprint

spliteasy.app

n 14. Deployment Guide

Backend Deployment

# 1. Clone repository

git clone https://github.com/yourorg/spliteasy-backend

cd spliteasy-backend && npm install

# 2. Configure environment

cp .env.example .env

# Fill in all values in .env

# 3. Run DB migrations

npx prisma migrate deploy

npx prisma generate

# 4. Build & start

npm run build

npm start

# OR with PM2 (process manager)

pm2 start dist/index.js --name spliteasy-api

pm2 save

pm2 startup

Mobile App Build (EAS)

# Development

cd mobile

npx expo start

# Production builds via Expo EAS

npm install -g eas-cli

eas login

# Android (APK / AAB)

eas build --platform android --profile production

# iOS (IPA)

eas build --platform ios --profile production

# Submit to stores

eas submit --platform android  # Google Play

eas submit --platform ios      # App Store

© 2024 SplitEasy. Confidential & Proprietary.

Page 22

SplitEasy — Developer Blueprint

spliteasy.app

n 15. Testing Strategy

Test Type

What's Covered

Unit Tests (Jest)

Split calculator, debt algorithm, SMS parser, currency utils

Integration Tests (Supertest)

Auth flow, CRUD for groups/expenses, settlement + balance update

E2E Tests (Detox)

Login ﬁ Create Group ﬁ Add Expense ﬁ Settle journey

API Load Tests (k6)

Concurrent expense creation, settlement endpoints

Payment Tests (Sandbox)

Razorpay test mode, UPI mock payments

Example Unit Test (Jest)

// splitCalculator.test.js

const { calculateSplits } = require('./splitCalculator');

describe('Equal Split', () => {

  test('splits equally among 4 members', () => {

    const result = calculateSplits({

      amount: 1200,

      split_type: 'equal',

      members: [

        { id: 'alice' }, { id: 'bob' },

        { id: 'charlie' }, { id: 'dave' },

      ],

    });

    expect(result).toHaveLength(4);

    result.forEach(split => {

      expect(split.amount).toBeCloseTo(300);

    });

  });

});

© 2024 SplitEasy. Confidential & Proprietary.

Page 23

SplitEasy — Developer Blueprint

spliteasy.app

n 16. Roadmap & Feature Checklist

v1.0 — MVP

n

n

n

n

n

n

n

n

Phone OTP login

Create groups (Trip, Home, Office, Custom)

Add & split expenses (Equal, Percentage)

View balance sheet

Manual settlements

Basic spending analytics

Push notifications

Dark mode

v1.5 — Growth

n

n

n

n

n

n

n

UPI payment integration (Razorpay)

SMS auto-import (Swiggy / Zomato / Blinkit)

Export reports (CSV)

Group chat / comments

Exact & Shares split modes

Multi-currency support

Receipt photo upload

v2.0 — Scale

n

n

n

n

n

n

n

Web app (React.js)

Recurring expenses

Budget limits per group

Advanced analytics (trends, fairness)

Team Premium plan

PDF export reports

Import from Splitwise

v3.0 — Premium

© 2024 SplitEasy. Confidential & Proprietary.

Page 24

SplitEasy — Developer Blueprint

spliteasy.app

n

n

n

n

n

n

n

AI-based expense categorization

Bank SMS auto-parse

Real-time currency rates

Shared shopping lists

Collaborative budgeting

Enterprise / Business accounts

White-label solution

Built with ⁄n — SplitEasy is a fresh take on expense splitting. This document is your complete
A–Z guide to building the app from scratch. Good luck!

© 2024 SplitEasy. Confidential & Proprietary.

Page 25

