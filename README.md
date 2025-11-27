# Trainform - Enterprise Training Management Platform

![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8.8.4-green?style=flat-square&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=flat-square&logo=tailwind-css)

> A production-ready, enterprise-grade multi-tenant SaaS platform for managing internal company training programs with role-based access control, real-time analytics, and comprehensive reporting.

---

## 🚀 Key Features

### Multi-Tenant Architecture
- **Complete Data Isolation** - Each company's data is completely separated
- **Subscription Management** - Plan-based access control with limits
- **Company-Scoped Queries** - All operations filtered by company context

### Role-Based Access Control (RBAC)
- **Super Admin** - Platform-wide management (companies, plans, global modules, analytics)
- **Company Admin** - Company-level management (training, team, analytics)
- **Staff** - Personal learning and progress tracking

### Training Management
- **4-Step Module Wizard** - Intuitive creation flow (metadata, slides, quiz, settings)
- **Rich Content** - Multiple slides with images and customizable layouts
- **MCQ Quizzes** - Points-based assessment with pass/fail thresholds
- **Preview & Edit** - Full preview with adjustable font sizes

### Real-Time Analytics
- **Completion Rates** - Track module and team completion
- **Engagement Metrics** - Monitor user participation
- **Pass Rates** - Analyze assessment performance
- **User-Wise Reports** - Detailed individual progress

### Security
- **JWT Authentication** - HTTP-Only cookies for session management
- **Bcrypt Encryption** - Secure password hashing (12 rounds)
- **Middleware Protection** - Route-based access control
- **Zod Validation** - Runtime type safety

---

## 🛠 Tech Stack

**Framework:** Next.js 15 (App Router)  
**Language:** TypeScript 5.7.2  
**Database:** MongoDB with Mongoose ODM  
**Authentication:** Custom JWT + bcrypt  
**Validation:** Zod  
**UI Components:** Shadcn UI (Radix primitives)  
**Styling:** Tailwind CSS 3.4.17  
**Icons:** Lucide React  
**Charts:** Recharts 3.5.0  

---

## 📦 Quick Start

### Prerequisites
- Node.js 18.x or higher
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/priyampathak/training.git
cd training

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and JWT secret

# Run development server
npm run dev

# Or build and run production
npm run build
npm start
```

### Environment Variables

Create a `.env.local` file:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### Seed Initial Data (Optional)

```bash
npm run seed
```

This creates:
- Super Admin: `hexerve@hexerve.com` / `1234`
- Basic Plan: $199, 10 users
- Sample Company: Carmell

---

## 📊 Project Structure

```
Training/
├── src/
│   ├── actions/              # Server Actions (16 files)
│   │   ├── auth.ts          # Authentication
│   │   ├── users.ts         # User management
│   │   ├── companies.ts     # Company management
│   │   ├── modules.ts       # Training modules
│   │   ├── analytics.ts     # Analytics & reporting
│   │   └── ...
│   │
│   ├── app/                 # Next.js App Router (22 routes)
│   │   ├── admin/           # Super Admin routes
│   │   ├── dashboard/
│   │   │   ├── admin/       # Super Admin dashboard
│   │   │   ├── company/     # Company Admin dashboard
│   │   │   └── learn/       # Staff learning portal
│   │   └── login/           # Authentication pages
│   │
│   ├── components/          # React Components (30+)
│   │   ├── ui/             # Shadcn UI components
│   │   ├── *Wizard.tsx     # Multi-step forms
│   │   └── *Modal.tsx      # Modal dialogs
│   │
│   ├── models/             # Mongoose Models (5)
│   │   ├── User.ts
│   │   ├── Company.ts
│   │   ├── Plan.ts
│   │   ├── TrainingModule.ts
│   │   └── ModuleProgress.ts
│   │
│   ├── lib/                # Utilities
│   │   ├── db.ts          # MongoDB connection
│   │   ├── cookies.ts     # Cookie configuration
│   │   └── utils.ts       # Helper functions
│   │
│   └── config/            # Configuration
│       └── nav.ts         # Role-based navigation
│
├── middleware.ts          # Route protection
├── DOCUMENTATION.md       # Complete documentation (1,200+ lines)
├── START_PRODUCTION.md    # Production guide
└── package.json
```

---

## 🔐 Default Credentials

### Super Admin
- **Email:** hexerve@hexerve.com
- **Password:** 1234

### Company Admin
- **Email:** carmell@carmell.io
- **Password:** password123

### Staff
- **Email:** pablo@carmell.io
- **Password:** password123

---

## 🎯 User Roles & Permissions

### Super Admin
- ✅ Manage all companies
- ✅ Create subscription plans
- ✅ Manage all users
- ✅ Create global training modules
- ✅ View platform-wide analytics
- ✅ Reset user passwords

### Company Admin
- ✅ Create company training modules
- ✅ Manage team members
- ✅ View company analytics
- ✅ Track team performance
- ✅ Assign training modules

### Staff
- ✅ View assigned training modules
- ✅ Take training courses
- ✅ Submit quiz assessments
- ✅ Track personal progress
- ✅ View completion status

---

## 📈 Analytics & Reporting

### Calculated Metrics
- **Completion Rate:** `(completed users / total staff) × 100`
- **Engagement Rate:** `(started users / total staff) × 100`
- **Average Score:** `sum(percentages) / count(completed)`
- **Pass Rate:** `(passed users / completed users) × 100`
- **Not Started:** `total staff - unique started`

All analytics are **real-time** with `force-dynamic` rendering and no caching.

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Self-Hosted

```bash
# Build
npm run build

# Start production server
npm start
```

---

## 🧪 Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production
npm start

# Lint code
npm run lint

# Seed database
npm run seed
npm run seed:staff
```

---

## 📝 Documentation

Comprehensive documentation available in:
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete project documentation
- **[START_PRODUCTION.md](./START_PRODUCTION.md)** - Production server guide

---

## 🔒 Security Features

- ✅ JWT with HTTP-Only cookies
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Middleware-based route protection
- ✅ Server-side session validation
- ✅ Zod input validation
- ✅ CSRF protection (SameSite cookies)
- ✅ Role-based query filtering
- ✅ Company data isolation

---

## 🛠 Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [MongoDB](https://www.mongodb.com/) - Database
- [Mongoose](https://mongoosejs.com/) - ODM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Lucide React](https://lucide.dev/) - Icons
- [Recharts](https://recharts.org/) - Charts

---

## 📊 Project Stats

- **Total Files:** 150+
- **Lines of Code:** 15,000+
- **Server Actions:** 16 files
- **React Components:** 30+
- **Database Models:** 5
- **Routes:** 22
- **User Roles:** 3

---

## 🤝 Contributing

This is a private internal training platform. For issues or feature requests, please contact the development team.

---

## 📄 License

This is a private internal training platform. All rights reserved.

---

## 🙏 Acknowledgments

Built with modern web standards and best practices for enterprise training management.

---

**Built with ❤️ using Next.js 15, TypeScript, MongoDB, and Tailwind CSS**

*Version: 1.0.0*  
*Last Updated: November 2024*

---

## 📞 Support

For technical support:
- 📧 Email: support@trainform.com
- 📖 Documentation: [DOCUMENTATION.md](./DOCUMENTATION.md)
- 🚀 Production Guide: [START_PRODUCTION.md](./START_PRODUCTION.md)

