# Trainform - Complete Project Documentation

> **Enterprise-Grade Internal Training Management Platform**  
> Built with Next.js 15, TypeScript, MongoDB, and Modern Authentication

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Installation & Setup](#installation--setup)
5. [Project Structure](#project-structure)
6. [File Routing](#file-routing)
7. [Database Models](#database-models)
8. [Authentication & Authorization](#authentication--authorization)
9. [Server Actions](#server-actions)
10. [Components](#components)
11. [User Roles & Permissions](#user-roles--permissions)
12. [Analytics & Reporting](#analytics--reporting)
13. [Deployment](#deployment)
14. [Environment Variables](#environment-variables)
15. [Seeded Data](#seeded-data)

---

## 🎯 Project Overview

**Trainform** is a comprehensive, multi-tenant SaaS platform designed for managing internal company training. It supports three distinct user roles with different capabilities, real-time analytics, subscription management, and comprehensive training module creation with slides and quizzes.

### **Key Highlights:**
- ✅ Multi-tenant architecture with complete data isolation
- ✅ Role-based access control (RBAC) with 3 user levels
- ✅ Real-time analytics and reporting
- ✅ Training module creation with slides + MCQ quizzes
- ✅ Subscription-based access control
- ✅ Custom JWT authentication with HTTP-Only cookies
- ✅ Production-ready with comprehensive error handling

---

## 🛠 Tech Stack

### **Core Technologies**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.0.4 | React framework with App Router |
| **TypeScript** | 5.7.2 | Type-safe development |
| **React** | 19.0.0 | UI library |
| **MongoDB** | 8.8.4 | NoSQL database |
| **Mongoose** | 8.8.4 | MongoDB ODM |

### **Authentication & Security**
- **bcryptjs** (2.4.3) - Password hashing
- **jsonwebtoken** (9.0.2) - JWT token generation
- **Zod** (3.24.1) - Runtime type validation
- HTTP-Only cookies for secure session management

### **UI & Styling**
- **Tailwind CSS** (3.4.17) - Utility-first CSS
- **Shadcn UI** - Radix UI primitives
- **Lucide React** (0.468.0) - Icon system
- **class-variance-authority** - Dynamic styling
- **tailwind-merge** - Class merging

### **Forms & Data Visualization**
- **react-hook-form** (7.66.1) - Form management
- **@hookform/resolvers** (5.2.2) - Form validation
- **recharts** (3.5.0) - Charts and graphs
- **date-fns** (4.1.0) - Date formatting

---

## 🚀 Features

### **1. Multi-Tenant Architecture**
- Complete data isolation between companies
- Company-scoped queries in all operations
- Subscription-based access control
- Plan-based user limits

### **2. Role-Based Access Control (RBAC)**

#### **SUPER_ADMIN**
- Manage all companies (create, edit, view)
- Create and manage subscription plans
- Manage all users across companies
- Create global training modules
- View platform-wide analytics
- Reset user passwords
- Access: `/dashboard/admin/*`

#### **COMPANY_ADMIN**
- Manage company-specific training modules
- Add/remove team members (Admin/Staff)
- View company analytics
- Track team performance
- Assign training modules
- Access: `/dashboard/company/*`

#### **STAFF**
- View assigned training modules
- Take training courses
- Track personal progress
- View completion status and scores
- Access: `/dashboard/learn/*`

### **3. Training Management**

#### **Module Creation** (4-Step Wizard)
1. **Metadata & Assignment**
   - Title, description, category
   - Company assignment (Global or Specific)
   - Difficulty level (Rookie/Pro/Legend)
   - Tags for categorization

2. **Content Builder**
   - Multiple slides per module
   - Rich text content
   - Image uploads via URL
   - Customizable layout

3. **Quiz Builder**
   - Multiple-choice questions (4 options)
   - Points per question
   - Correct answer selection
   - Minimum 1 question required

4. **Settings & Display**
   - Passing points threshold
   - Per-question points
   - Heading font size (default 32px)
   - Content font size (default 18px)
   - Mandatory/Optional flag

#### **Module Features**
- Preview with adjustable font sizes
- Edit existing modules
- Toggle active/inactive status
- Delete with confirmation
- Version control via timestamps

### **4. Quiz System**
- MCQ-based assessments
- Dynamic scoring based on points
- Pass/fail determination
- Answer submission tracking
- Attempt history
- Real-time score calculation

### **5. Analytics & Reporting**

#### **Super Admin Analytics**
- Total users, companies, modules
- Platform-wide completion rates
- Revenue per plan
- Top performing companies
- Most popular modules
- 30-day growth metrics
- User distribution by role

#### **Company Admin Analytics**
- Total staff count
- Module completion rates
- Average scores
- Engagement rates
- Pass rates
- Not-started counts
- Top performers
- Recent activity
- User-wise performance charts

#### **Staff Analytics**
- Personal completion rate
- Average score
- Total attempts
- Modules completed/in-progress
- Pass/fail status
- Time spent (via timestamps)

### **6. Subscription Management**
- Multiple subscription plans
- Plan-based user limits
- Active/Past Due/Cancelled statuses
- Auto-blocking for cancelled subscriptions
- 5-second warning for past due
- Persistent blocking modal for cancelled

### **7. Team Management**
- Add team members (Admin/Staff roles)
- Delete team members (hard delete)
- Toggle active/inactive status
- Self-protection (can't delete self)
- Email uniqueness validation
- Password requirements (min 6 chars)

### **8. Security Features**
- JWT with HTTP-Only cookies
- Bcrypt password hashing (12 rounds)
- Middleware-based route protection
- Server-side session validation
- Zod input validation
- CSRF protection via same-site cookies
- Role-based query filtering
- Company data isolation

---

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18.x or higher
- npm or yarn
- MongoDB Atlas account (or local MongoDB)

### **Step 1: Clone the Repository**
```bash
git clone <repository-url>
cd Training
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Environment Setup**

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.mongodb.net/trainform?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**⚠️ SECURITY WARNING:**  
- Change `JWT_SECRET` to a secure random string (min 32 characters)
- Never commit `.env.local` to version control
- Use different secrets for development and production

### **Step 4: Run Development Server**
```bash
npm run dev
```

Navigate to: `http://localhost:3000`

### **Step 5: Seed Initial Data (Optional)**
```bash
npm run seed
```

This creates:
- Super Admin (hexerve@hexerve.com / 1234)
- Basic Plan ($199, 10 users)
- Sample company (Carmell)

---

## 📁 Project Structure

```
Training/
│
├── src/
│   ├── actions/                    # Server Actions (API endpoints)
│   │   ├── auth.ts                # Login, logout, session management
│   │   ├── users.ts               # User CRUD, password reset
│   │   ├── companies.ts           # Company management
│   │   ├── plans.ts               # Subscription plans
│   │   ├── modules.ts             # Training modules (Super Admin)
│   │   ├── company-training.ts    # Company training modules
│   │   ├── company-modules.ts     # Company module analytics
│   │   ├── team.ts                # Team member management
│   │   ├── staff.ts               # Staff dashboard data
│   │   ├── courses.ts             # Available courses for staff
│   │   ├── progress.ts            # Staff progress tracking
│   │   ├── quiz.ts                # Quiz submission & scoring
│   │   ├── analytics.ts           # Company analytics
│   │   ├── company-dashboard.ts   # Company dashboard data
│   │   ├── super-admin-dashboard.ts # Super admin dashboard
│   │   └── subscription.ts        # Subscription status checks
│   │
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Authentication routes
│   │   │   ├── login/
│   │   │   │   ├── layout.tsx    # Login layout with redirect
│   │   │   │   └── page.tsx      # General login page
│   │   │   └── admin/
│   │   │       └── login/
│   │   │           ├── layout.tsx
│   │   │           └── page.tsx  # Super Admin login
│   │   │
│   │   ├── dashboard/             # Main dashboard (protected)
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   │
│   │   │   ├── admin/             # Super Admin routes
│   │   │   │   ├── page.tsx       # Super Admin dashboard
│   │   │   │   ├── analytics/     # Platform analytics
│   │   │   │   ├── companies/     # Company management
│   │   │   │   ├── plans/         # Plan management
│   │   │   │   ├── users/         # User management
│   │   │   │   └── modules/       # Global modules
│   │   │   │
│   │   │   ├── company/           # Company Admin routes
│   │   │   │   ├── page.tsx       # Company dashboard
│   │   │   │   ├── training/      # Create training modules
│   │   │   │   ├── modules/       # View all modules
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── analytics/  # Module analytics
│   │   │   │   │       └── responses/  # User responses
│   │   │   │   ├── team/          # Team management
│   │   │   │   └── analytics/     # Company analytics
│   │   │   │
│   │   │   └── learn/             # Staff routes
│   │   │       ├── page.tsx       # Staff dashboard
│   │   │       ├── courses/       # Available courses
│   │   │       └── progress/      # Progress tracking
│   │   │
│   │   ├── api/                   # API routes (testing)
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   │
│   ├── components/                # React Components
│   │   ├── ui/                    # Shadcn UI primitives
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── table.tsx
│   │   │   └── textarea.tsx
│   │   │
│   │   ├── Sidebar.tsx            # Dynamic sidebar navigation
│   │   ├── Topbar.tsx             # Top navigation bar
│   │   ├── CreateModuleWizard.tsx # Super Admin module wizard
│   │   ├── EditModuleWizard.tsx   # Edit module wizard
│   │   ├── CreateCompanyModuleWizard.tsx # Company module wizard
│   │   ├── EditCompanyModuleWizard.tsx   # Edit company module
│   │   ├── PreviewModuleModal.tsx # Module preview with navigation
│   │   ├── TrainingModuleViewer.tsx # Staff module viewer
│   │   ├── QuizViewer.tsx         # Quiz interface
│   │   ├── TestResultModal.tsx    # Quiz results display
│   │   ├── AddCompanyModal.tsx    # Add company form
│   │   ├── AddPlanModal.tsx       # Add plan form
│   │   ├── AddUserModal.tsx       # Add user form
│   │   ├── ResetPasswordModal.tsx # Password reset form
│   │   └── SubscriptionStatusModal.tsx # Subscription alerts
│   │
│   ├── config/                    # Configuration
│   │   └── nav.ts                 # Navigation items per role
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── db.ts                  # MongoDB connection (singleton)
│   │   ├── cookies.ts             # Cookie configuration
│   │   └── utils.ts               # Helper functions
│   │
│   └── models/                    # Mongoose Models
│       ├── User.ts                # User schema
│       ├── Company.ts             # Company schema
│       ├── Plan.ts                # Subscription plan schema
│       ├── TrainingModule.ts      # Training module schema
│       └── ModuleProgress.ts      # Progress tracking schema
│
├── scripts/                       # Database seeding scripts
│   ├── seed.ts                    # Main seed script
│   ├── seed-plan.ts               # Seed basic plan
│   ├── seed-staff.ts              # Seed staff user
│   └── [other seed scripts]
│
├── middleware.ts                  # Route protection middleware
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
└── DOCUMENTATION.md               # This file
```

---

## 🗺️ File Routing

### **Public Routes (No Authentication Required)**
| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Landing page |
| `/login` | `src/app/login/page.tsx` | General user login |
| `/admin/login` | `src/app/admin/login/page.tsx` | Super Admin login |

### **Super Admin Routes** (`/dashboard/admin/*`)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/admin` | `src/app/dashboard/admin/page.tsx` | Super Admin dashboard with platform stats |
| `/dashboard/admin/analytics` | `src/app/dashboard/admin/analytics/page.tsx` | Platform-wide analytics |
| `/dashboard/admin/companies` | `src/app/dashboard/admin/companies/page.tsx` | Manage all companies |
| `/dashboard/admin/plans` | `src/app/dashboard/admin/plans/page.tsx` | Manage subscription plans |
| `/dashboard/admin/users` | `src/app/dashboard/admin/users/page.tsx` | Manage all users |
| `/dashboard/admin/modules` | `src/app/dashboard/admin/modules/page.tsx` | Manage global training modules |

### **Company Admin Routes** (`/dashboard/company/*`)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/company` | `src/app/dashboard/company/page.tsx` | Company dashboard |
| `/dashboard/company/training` | `src/app/dashboard/company/training/page.tsx` | Create company training modules |
| `/dashboard/company/modules` | `src/app/dashboard/company/modules/page.tsx` | View all modules with analytics |
| `/dashboard/company/modules/[id]/analytics` | `src/app/dashboard/company/modules/[id]/analytics/page.tsx` | Detailed module analytics |
| `/dashboard/company/modules/[id]/responses` | `src/app/dashboard/company/modules/[id]/responses/page.tsx` | User responses |
| `/dashboard/company/team` | `src/app/dashboard/company/team/page.tsx` | Manage team members |
| `/dashboard/company/analytics` | `src/app/dashboard/company/analytics/page.tsx` | Company analytics |

### **Staff Routes** (`/dashboard/learn/*`)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard/learn` | `src/app/dashboard/learn/page.tsx` | Staff dashboard |
| `/dashboard/learn/courses` | `src/app/dashboard/learn/courses/page.tsx` | Available training courses |
| `/dashboard/learn/progress` | `src/app/dashboard/learn/progress/page.tsx` | Personal progress tracking |

### **Route Protection Flow**
```
User Request
    ↓
Middleware (middleware.ts)
    ↓
Check JWT Cookie
    ↓
Valid? → Extract role
    ↓
Role matches route?
    ↓
Yes → Allow access
No  → Redirect to appropriate dashboard
```

---

## 🗄️ Database Models

### **1. User Model** (`src/models/User.ts`)

```typescript
interface IUser {
  _id: ObjectId;
  name: string;                    // Full name
  email: string;                   // Unique, indexed
  password?: string;               // Bcrypt hashed, optional (for SSO)
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'STAFF';
  companyId?: ObjectId;            // null for SUPER_ADMIN
  designation?: string;            // Job title
  lastLoginAt?: Date;              // Last login timestamp
  isActive: boolean;               // Active/Inactive status
  isDeleted: boolean;              // Soft delete flag
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `email` (unique)
- `companyId` (for company-scoped queries)

**Validations:**
- Email: Valid format, unique
- Password: Min 6 characters (when required)
- Role: Enum validation
- Company: Required for COMPANY_ADMIN and STAFF

---

### **2. Company Model** (`src/models/Company.ts`)

```typescript
interface ICompany {
  _id: ObjectId;
  name: string;                    // Company name
  slug: string;                    // URL-friendly slug (unique, indexed)
  logoUrl?: string;                // Logo image URL
  contactEmail: string;            // Primary contact
  
  subscription: {
    planId?: ObjectId;             // Reference to Plan
    planName?: string;             // Denormalized plan name
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    validTill?: Date;              // Subscription end date
  };
  
  limits: {
    maxStaff: number;              // Max team members
    maxStorageMB: number;          // Storage limit
  };
  
  branding?: {
    primaryColor?: string;         // Brand color
  };
  
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `slug` (unique)
- `subscription.status`

---

### **3. Plan Model** (`src/models/Plan.ts`)

```typescript
interface IPlan {
  _id: ObjectId;
  name: string;                    // Plan name (unique)
  features: string[];              // List of features
  usersLimit: number;              // Max users allowed
  price: number;                   // Price in USD
  isActive: boolean;               // Active/Inactive
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```javascript
{
  name: "Basic",
  features: ["10 Users", "15 training modules/month"],
  usersLimit: 10,
  price: 199,
  isActive: true
}
```

---

### **4. TrainingModule Model** (`src/models/TrainingModule.ts`)

```typescript
interface ITrainingModule {
  _id: ObjectId;
  
  // Assignment
  assignedCompanyId?: ObjectId;    // null = global module
  isGlobal: boolean;               // Calculated from assignedCompanyId
  
  // Metadata
  meta: {
    title: string;                 // Module title (max 100 chars)
    description: string;           // Summary (max 500 chars)
    category: string;              // Category name
    tags: string[];                // Tags for search
    difficulty: 'ROOKIE' | 'PRO' | 'LEGEND';
  };
  
  // Content
  slides: Array<{
    heading: string;               // Slide heading (max 10 words)
    content: string;               // Slide content (max 100 words)
    mediaUrl?: string;             // Image/video URL
    layout: string;                // Layout type
    order: number;                 // Display order
  }>;
  
  // Assessment
  quiz: Array<{
    question: string;              // Question text
    options: string[];             // Exactly 4 options
    correctIndex: number;          // 0-3 (correct answer)
    points: number;                // Points for this question
  }>;
  
  // Scoring
  assessment: {
    totalPoints: number;           // Sum of all question points
    passingPoints: number;         // Points needed to pass
    passingPercentage: number;     // Calculated percentage
  };
  
  // Display Settings
  display?: {
    headingFontSize: number;       // Default 32px
    contentFontSize: number;       // Default 18px
  };
  
  // Settings
  settings: {
    isMandatory: boolean;          // Required for all staff?
    timeLimit?: number;            // Time limit in minutes
    attemptsAllowed?: number;      // Max attempts (null = unlimited)
    certificateEnabled?: boolean;  // Future feature
  };
  
  isActive: boolean;
  isDeleted: boolean;
  createdBy: ObjectId;             // User who created it
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `meta.title`
- `assignedCompanyId`
- `isActive`
- `createdBy`

---

### **5. ModuleProgress Model** (`src/models/ModuleProgress.ts`)

```typescript
interface IModuleProgress {
  _id: ObjectId;
  userId: ObjectId;                // Staff member
  moduleId: ObjectId;              // Training module
  companyId: ObjectId;             // Company (for analytics)
  
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  
  score?: number;                  // Points earned
  percentage?: number;             // Score percentage
  isPassed?: boolean;              // Pass/fail status
  
  attemptCount: number;            // Number of attempts
  answers: Record<number, number>; // Question index → selected option
  
  startedAt?: Date;
  completedAt?: Date;
  lastAttemptAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `userId + moduleId` (unique compound)
- `companyId` (for company analytics)
- `status`

---

## 🔐 Authentication & Authorization

### **Authentication Flow**

```
1. User Login
   ├─ Email + Password submitted
   ├─ Server Action: login(formData)
   ├─ Validate credentials (bcrypt.compare)
   ├─ Generate JWT token
   ├─ Set HTTP-Only cookie
   └─ Redirect to role-based dashboard

2. Protected Route Access
   ├─ Middleware intercepts request
   ├─ Read JWT from cookie
   ├─ Verify token signature
   ├─ Extract user data (id, role, companyId)
   ├─ Check role matches route
   └─ Allow or redirect

3. Logout
   ├─ Server Action: logout()
   ├─ Clear HTTP-Only cookie
   └─ Redirect to /login
```

### **Password Security**
- **Hashing:** bcrypt with 12 salt rounds
- **Storage:** Never stored in plaintext
- **Reset:** Super Admin can reset any user's password
- **Validation:** Minimum 6 characters

### **JWT Token Structure**
```javascript
{
  userId: ObjectId,
  email: string,
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'STAFF',
  companyId: ObjectId | null,
  iat: number,     // Issued at
  exp: number      // Expires (7 days default)
}
```

### **Cookie Configuration** (`src/lib/cookies.ts`)
```typescript
{
  name: "auth-token",
  httpOnly: true,      // Prevents XSS
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',     // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60  // 7 days
}
```

### **Route Protection Matrix**

| Route Pattern | Allowed Role(s) | Redirect If Unauthorized |
|---------------|-----------------|--------------------------|
| `/dashboard/admin/*` | `SUPER_ADMIN` | `/dashboard/company` or `/dashboard/learn` |
| `/dashboard/company/*` | `COMPANY_ADMIN` | `/dashboard/admin` or `/dashboard/learn` |
| `/dashboard/learn/*` | `STAFF` | `/dashboard/admin` or `/dashboard/company` |
| `/login` | Any (logged out) | Redirect to dashboard if logged in |

---

## ⚙️ Server Actions

### **Authentication** (`src/actions/auth.ts`)
```typescript
login(formData: FormData)          // Login user, set cookie
logout()                           // Destroy session
getSession()                       // Get current user session
```

### **User Management** (`src/actions/users.ts`)
```typescript
getAllUsers()                      // Get all users (Super Admin)
createUser(data)                   // Create new user
updateUser(id, data)               // Update user
deleteUser(id)                     // Hard delete user
toggleUserStatus(id)               // Toggle active/inactive
resetUserPassword(id, newPassword) // Reset password (Super Admin)
getCurrentUser()                   // Get logged-in user
```

### **Company Management** (`src/actions/companies.ts`)
```typescript
getAllCompanies()                  // Get all companies
createCompany(data)                // Create company + assign admin
searchUserByEmail(email)           // Find admin user for assignment
updateCompanySubscription(id, status) // Update subscription
```

### **Plan Management** (`src/actions/plans.ts`)
```typescript
getAllPlans()                      // Get all plans
createPlan(data)                   // Create new plan
updatePlan(id, data)               // Update plan
deletePlan(id)                     // Delete plan
togglePlanStatus(id)               // Toggle active/inactive
```

### **Training Modules - Super Admin** (`src/actions/modules.ts`)
```typescript
getAllModules()                    // Get all modules
getModuleById(id)                  // Get single module
createTrainingModule(data)         // Create module (4-step wizard)
updateTrainingModule(id, data)     // Update module
deleteModule(id)                   // Delete module
toggleModuleStatus(id)             // Toggle active/inactive
updateModuleDisplaySettings(id, sizes) // Save font sizes
getCompaniesForModule()            // Get companies for dropdown
```

### **Training Modules - Company Admin** (`src/actions/company-training.ts`)
```typescript
getCompanyTrainingModules()        // Get company modules
createCompanyTrainingModule(data)  // Create company module
getCompanyModuleById(id)           // Get module for editing
updateCompanyTrainingModule(id, data) // Update module
deleteCompanyModule(id)            // Delete module
toggleCompanyModuleStatus(id)      // Toggle active/inactive
```

### **Company Analytics** (`src/actions/company-modules.ts`)
```typescript
getCompanyModules()                // Get modules with analytics
```

### **Company Analytics - Detailed** (`src/actions/analytics.ts`)
```typescript
getCompanyAnalytics()              // Overview stats
getModuleDetailedAnalytics(moduleId) // Per-module analytics
```

### **Team Management** (`src/actions/team.ts`)
```typescript
getTeamMembers()                   // Get company team
addTeamMember(data)                // Add team member
deleteTeamMember(id)               // Hard delete member
toggleTeamMemberStatus(id)         // Toggle active/inactive
```

### **Staff Dashboard** (`src/actions/staff.ts`)
```typescript
getStaffDashboard()                // Get staff overview
```

### **Courses** (`src/actions/courses.ts`)
```typescript
getAvailableCourses()              // Get available modules for staff
```

### **Progress Tracking** (`src/actions/progress.ts`)
```typescript
getStaffProgress()                 // Get detailed progress
```

### **Quiz & Submission** (`src/actions/quiz.ts`)
```typescript
startModule(moduleId)              // Mark as IN_PROGRESS
submitQuiz(moduleId, answers)      // Submit quiz and calculate score
```

### **Subscription** (`src/actions/subscription.ts`)
```typescript
checkSubscriptionStatus()          // Check company subscription
```

### **Dashboards**
```typescript
// src/actions/company-dashboard.ts
getCompanyDashboardAnalytics()     // Company dashboard data

// src/actions/super-admin-dashboard.ts
getSuperAdminDashboard()           // Super Admin dashboard
getSuperAdminAnalytics()           // Platform analytics
```

---

## 🧩 Components

### **Layout Components**
- **`Sidebar.tsx`** - Dynamic navigation based on user role
- **`Topbar.tsx`** - Top navigation with user menu and logout

### **Modal Components**
- **`CreateModuleWizard.tsx`** - 4-step wizard for Super Admin
- **`EditModuleWizard.tsx`** - Edit wizard for Super Admin
- **`CreateCompanyModuleWizard.tsx`** - 4-step wizard for Company Admin
- **`EditCompanyModuleWizard.tsx`** - Edit wizard for Company Admin
- **`PreviewModuleModal.tsx`** - Preview slides with font controls
- **`TrainingModuleViewer.tsx`** - Staff training viewer
- **`QuizViewer.tsx`** - MCQ quiz interface
- **`TestResultModal.tsx`** - Quiz results display
- **`AddCompanyModal.tsx`** - Add company form
- **`AddPlanModal.tsx`** - Add plan form
- **`AddUserModal.tsx`** - Add user form
- **`ResetPasswordModal.tsx`** - Password reset form
- **`SubscriptionStatusModal.tsx`** - Subscription alerts

### **UI Components** (Shadcn)
All components use Radix UI primitives with Tailwind styling:
- `badge`, `button`, `card`, `dialog`
- `input`, `label`, `progress`, `select`
- `slider`, `table`, `textarea`

---

## 👥 User Roles & Permissions

### **SUPER_ADMIN**
**Access:** Platform-wide management

| Feature | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Companies | ✅ | ✅ | ✅ | ✅ |
| Plans | ✅ | ✅ | ✅ | ✅ |
| Users (All) | ✅ | ✅ | ✅ | ✅ |
| Global Modules | ✅ | ✅ | ✅ | ✅ |
| Analytics (Platform) | - | ✅ | - | - |
| Password Reset | ✅ | - | - | - |

**Navigation:**
- Dashboard
- Analytics
- Companies
- Plans
- Users
- Global Modules

---

### **COMPANY_ADMIN**
**Access:** Company-scoped management

| Feature | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Company Modules | ✅ | ✅ | ✅ | ✅ |
| Team Members | ✅ | ✅ | ✅ | ✅ |
| Company Analytics | - | ✅ | - | - |
| Module Analytics | - | ✅ | - | - |

**Navigation:**
- Dashboard
- Create Training
- Training Modules
- Team Members
- Analytics

---

### **STAFF**
**Access:** Personal learning

| Feature | Create | Read | Update | Delete |
|---------|--------|------|--------|--------|
| Take Courses | - | ✅ | - | - |
| Submit Quizzes | ✅ | ✅ | - | - |
| View Progress | - | ✅ | - | - |

**Navigation:**
- My Learning
- Available Courses
- My Progress

---

## 📊 Analytics & Reporting

### **Analytics Calculations**

All analytics use real-time MongoDB aggregation:

```typescript
// Completion Rate
completionRate = (completedUsers / totalStaff) * 100

// Engagement Rate
engagementRate = (startedUsers / totalStaff) * 100

// Average Score
averageScore = sum(percentages) / count(completed)

// Pass Rate
passRate = (passedUsers / completedUsers) * 100

// Not Started
notStarted = totalStaff - uniqueStartedUsers
```

### **Data Sources**
- `User` collection - Total staff count
- `ModuleProgress` collection - Completion, scores, attempts
- `TrainingModule` collection - Module metadata

### **Real-Time Enforcement**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

---

## 🚀 Deployment

### **Production Build**

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### **Vercel Deployment** (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### **Docker Deployment**

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

### **Environment Variables for Production**

```env
# Database
MONGODB_URI=mongodb+srv://production_user:password@cluster.mongodb.net/trainform

# JWT (MUST CHANGE!)
JWT_SECRET=<64-character-random-string>
JWT_EXPIRES_IN=7d

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Environment
NODE_ENV=production
```

---

## 🔧 Environment Variables

### **Required Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Random string |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `NEXT_PUBLIC_APP_URL` | App base URL | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` or `production` |

### **Security Best Practices**

1. ✅ Use strong, random JWT secret (64+ characters)
2. ✅ Never commit `.env.local` to version control
3. ✅ Use different secrets for dev/staging/prod
4. ✅ Rotate JWT secrets periodically
5. ✅ Use environment-specific MongoDB databases

---

## 🌱 Seeded Data

### **Default Super Admin**
```
Email: hexerve@hexerve.com
Password: 1234
Role: SUPER_ADMIN
```

### **Default Plan**
```
Name: Basic
Features: ["10 Users", "15 training modules/month"]
Users Limit: 10
Price: $199
```

### **Default Company**
```
Name: Carmell
Slug: carmell
Admin: carmell@carmell.io / password123
Plan: Basic
```

### **Test Staff User**
```
Email: pablo@carmell.io
Password: password123
Role: STAFF
Company: Carmell
```

---

## 🔄 Workflow Examples

### **1. Creating a Training Module (Company Admin)**

```
1. Login → /dashboard/company/training
2. Click "Create Module"
3. Step 1: Enter title, description, category, difficulty, tags
4. Step 2: Add slides (heading, content, image URL)
5. Step 3: Add quiz questions (4 options, points, correct answer)
6. Step 4: Set passing points, font sizes
7. Click "Create Module"
8. Module created and visible in company modules list
```

### **2. Taking a Training Course (Staff)**

```
1. Login → /dashboard/learn/courses
2. Click "Start Training" on any module
3. Read slides (Previous/Next navigation)
4. Reach last slide → "Start Test" enabled
5. Click "Start Test"
6. Answer MCQ questions
7. Click "Save and End Test"
8. View results (score, percentage, pass/fail)
9. Progress saved in database
```

### **3. Viewing Analytics (Company Admin)**

```
1. Login → /dashboard/company/analytics
2. View overview (total staff, modules, completion rate)
3. See module completion rates table
4. Click "View" on any module
5. Modal opens with:
   - User-wise performance table
   - Status distribution pie chart
   - Individual scores and attempts
```

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Seed database
npm run seed

# Seed staff user
npm run seed:staff
```

---

## 📝 Additional Notes

### **Known Limitations**
- No email verification (future feature)
- No SSO integration (future feature)
- No certificate generation (future feature)
- No time limits on quizzes (future feature)
- No attempt limits (future feature)

### **Future Enhancements**
- Email notifications
- Real-time collaboration
- Video content support
- Certificate generation
- Advanced reporting
- Mobile app
- API for integrations

---

## 🤝 Support & Contact

For technical support or questions:
- Email: support@trainform.com
- Documentation: This file
- Issues: GitHub Issues (if repository is public)

---

## 📜 License

This is a private internal training platform. All rights reserved.

---

## 🏁 Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Create `.env.local` file
- [ ] Set MongoDB URI
- [ ] Set JWT secret (min 32 chars)
- [ ] Run `npm run seed` (optional)
- [ ] Run `npm run dev`
- [ ] Login as Super Admin (hexerve@hexerve.com / 1234)
- [ ] Create your first company
- [ ] Create your first plan
- [ ] Add users
- [ ] Create training modules
- [ ] Test staff workflow

---

**Built with ❤️ using Next.js 15, TypeScript, MongoDB, and Modern Web Standards**

*Last Updated: November 2024*
*Version: 1.0.0*

