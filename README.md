# 🚀 Smart Task Planner 

A Next.js application that uses Google's Gemini AI to break down goals into actionable tasks with timelines and dependencies. Features complete authentication with JWT tokens, MongoDB, and email verification via OTP.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue)
![JWT](https://img.shields.io/badge/JWT-Auth-orange)

## ✨ Features

- 🤖 **AI-powered task breakdown** using Gemini API
- 🔐 **Complete authentication system** (signup, login, email verification)
- 📧 **Email-based OTP verification** using Nodemailer
- 🔑 **JWT token authentication** with refresh tokens
- 🗄️ **MongoDB database** for user management
- 📊 **Visual timeline chart** for task planning
- 🔗 **Task dependency management**
- 🎨 **Dark/Light theme** support
- ⚡ **Real-time task generation**
- 🔒 **Protected API routes**

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- A **MongoDB database** (MongoDB Atlas recommended - free tier available)
- A **Gmail account** (or other email provider) for sending emails
- A **Gemini API key** from Google AI Studio

## 🚀 Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Set Up MongoDB

#### Option A: MongoDB Atlas (Recommended - Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

#### Option B: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/task_planner`

### 3. Set Up Email (Gmail Example)

1. Go to your [Google Account](https://myaccount.google.com/)
2. Enable **2-Factor Authentication** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Create a new app password for "Mail"
5. Copy the 16-character password

### 4. Configure Environment Variables

Open `.env.local` and update the following:

\`\`\`env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB - Replace with your connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task_planner?retryWrites=true&w=majority

# JWT Secrets - Generate random strings (32+ characters)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_at_least_32_characters

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password

# Application URL
NEXT_PUBLIC_APP_URL=http://smart-task-planner-pied.vercel.app
\`\`\`

**Important:**
- Generate strong random strings for JWT secrets using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Never commit `.env.local` to version control (already in `.gitignore`)

### 5. Install Dependencies

\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 6. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at **http://smart-task-planner-pied.vercel.app**

## 📖 How to Use

### First Time Setup

1. Navigate to http://smart-task-planner-pied.vercel.app
2. You'll be redirected to `/auth` (login page)
3. Click **"Sign up"** to create an account
4. Enter your email and password (min 6 characters)
5. Check your email for a **6-digit OTP code**
6. Enter the OTP to verify your email
7. Log in with your credentials

### Using the Task Planner

1. After logging in, enter your goal (e.g., "Launch a mobile app in 3 weeks")
2. Click **"Generate Plan"**
3. The AI will break down your goal into tasks with:
   - Task names
   - Estimated durations
   - Dependencies between tasks
4. View the tasks in a list and visualize them on a timeline chart
5. Use **"Reset"** to start over with a new goal
6. Click **"Logout"** when done

## 🔐 Authentication Features

### Email & Password Authentication
- Secure password hashing with bcrypt
- Minimum password requirements enforced
- Email format validation

### OTP Email Verification
- 6-digit OTP sent to email
- 10-minute expiration time
- Resend OTP functionality
- Welcome email on successful verification

### JWT Token System
- Access tokens (15-minute expiration)
- Refresh tokens (7-day expiration)
- HttpOnly cookies for refresh tokens
- Automatic token refresh

### Protected Routes
- `/api/generate-plan` requires authentication
- Main page redirects to `/auth` if not logged in
- Logout clears all tokens

## 🛣️ API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/logout` | POST | Logout and clear tokens |
| `/api/auth/verify-otp` | POST | Verify email with OTP |
| `/api/auth/resend-otp` | POST | Resend OTP code |
| `/api/auth/refresh` | POST | Refresh access token |

### Task Planning

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate-plan` | POST | Generate task plan (requires auth) |

## 📁 Project Structure

\`\`\`
app/
  ├── api/
  │   ├── auth/
  │   │   ├── login/route.js           # Login endpoint
  │   │   ├── signup/route.js          # Signup endpoint
  │   │   ├── logout/route.js          # Logout endpoint
  │   │   ├── verify-otp/route.js      # OTP verification
  │   │   ├── resend-otp/route.js      # Resend OTP
  │   │   └── refresh/route.js         # Token refresh
  │   └── generate-plan/route.js       # AI task generation (protected)
  ├── auth/page.jsx                    # Authentication page
  ├── layout.jsx                       # Root layout with providers
  └── page.jsx                         # Main task planner (protected)

components/
  ├── auth/
  │   ├── login-form.jsx               # Login form component
  │   ├── signup-form.jsx              # Signup form component
  │   └── verify-otp-form.jsx          # OTP verification form
  └── planner/
      ├── task-list.jsx                # Task list display
      ├── timeline-chart.jsx           # Timeline visualization
      └── theme-toggle.jsx             # Theme switcher

lib/
  ├── auth-context.jsx                 # Auth React context
  ├── mongodb.js                       # MongoDB connection
  ├── jwt.js                           # JWT utilities
  ├── email.js                         # Email service (Nodemailer)
  ├── middleware/
  │   └── auth.js                      # Auth middleware
  └── models/
      └── user.js                      # User model & functions
\`\`\`

## 🛠️ Technologies Used

- **Next.js 15** - React framework with App Router
- **Google Gemini AI** - AI task generation
- **MongoDB** - User database
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email sending
- **Tailwind CSS** - Styling
- **Recharts** - Timeline visualization
- **Radix UI** - Accessible components

## 🔒 Security Features

✅ Password hashing with bcrypt (10 rounds)  
✅ JWT tokens with short expiration  
✅ HttpOnly cookies for refresh tokens  
✅ Email verification required  
✅ OTP expiration (10 minutes)  
✅ Protected API routes  
✅ Environment variables for secrets  
✅ Input validation  
✅ CORS protection  

## 🐛 Troubleshooting

### "API key not configured"
- Check that `GEMINI_API_KEY` is set in `.env.local`
- Restart the development server after adding the key

### "MongoDB connection failed"
- Verify your `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure network connectivity

### "Email not sent" / OTP not received
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- For Gmail: Make sure you're using an App Password, not your regular password
- Check spam/junk folder
- Verify 2FA is enabled on Gmail account

### Dependency conflicts
- Always use `--legacy-peer-deps` flag with npm install
- Delete `node_modules` and `package-lock.json`, then reinstall

### "Unauthorized" errors
- Clear browser cookies and local storage
- Log out and log back in
- Check if access token is being sent in Authorization header

### Database connection issues
- **MongoDB Atlas**: Whitelist your IP address (0.0.0.0/0 for development)
- Check if MongoDB cluster is active
- Verify connection string format

## 🌍 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google AI API key | `AIzaSy...` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster...` |
| `JWT_SECRET` | Secret for access tokens | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random 32+ char string |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email address | `your@email.com` |
| `EMAIL_PASSWORD` | Email app password | 16-character app password |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://smart-task-planner-pied.vercel.app` |

## 🚀 Production Deployment

Before deploying to production:

✅ Generate strong JWT secrets  
✅ Use production MongoDB cluster  
✅ Configure proper CORS settings  
✅ Enable HTTPS (automatic on Vercel)  
✅ Set `NODE_ENV=production`  
✅ Review security headers  
✅ Set up monitoring and logging  

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💬 Support

If you have any questions or need help, please open an issue.

---

**Built with ❤️ using Next.js and Gemini AI**
