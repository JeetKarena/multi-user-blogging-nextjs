# Full-Stack Blogging Platform – Technical Brief & Setup Guide
*(Updated for Production-Ready Multi-User Blogging Platform)*

---

## 1. Project Overview
Build a **Production-Ready Multi-User Blogging Platform** with authentication, rich content editing, draft management, and admin features.

**Timeline:** 7-10 days | **Effort:** 16-20 hours | **Tech Stack:** Next.js 15, PostgreSQL, tRPC, Drizzle ORM

### Core Technologies
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** tRPC, Drizzle ORM, PostgreSQL
- **Auth:** JWT with access/refresh tokens, OTP-based registration
- **UI:** shadcn/ui, TipTap rich text editor, Lucide icons
- **Email:** Resend API for notifications
- **Deployment:** Vercel-ready with automated cleanup

---

## 2. Current Feature Set

### ✅ Implemented Features

#### 🔐 Authentication System
- OTP-based user registration with email verification
- JWT authentication (access + refresh tokens)
- Role-based permissions (admin, editor, user)
- Secure password reset with OTP
- Session management and middleware

#### 📝 Content Management
- **Rich Text Editor** - TipTap with image upload, formatting, and link support
- **Draft System** - Save posts as drafts, edit existing drafts, separate from published posts
- **Post Management** - Create, edit, delete, publish/unpublish posts
- **Category System** - Create/manage categories, assign to posts
- **Post Statistics** - Views, likes, comments tracking
- **SEO Features** - Meta titles, descriptions, and OpenGraph support

#### 🎨 User Interface
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Dark Mode** - Automatic theme switching
- **Modern Components** - shadcn/ui component library
- **Dashboard** - User posts, drafts, and statistics
- **Admin Panel** - User management and system monitoring

#### 🛠️ Developer Features
- **Type-Safe APIs** - End-to-end type safety with tRPC
- **Database Migrations** - Drizzle ORM with schema versioning
- **Health Monitoring** - `/api/health` endpoint
- **Automated Cleanup** - Cron jobs for expired registrations
- **API Testing** - Postman collection included
- **File Upload** - Local image upload with validation

---

## 3. Quick Local Setup (5 minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud like Neon/Supabase)

### Installation Steps

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   cd blogging-platform
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and API keys
   ```

### Required Environment Variables

**Database (PostgreSQL):**
- `DATABASE_URL` - Full PostgreSQL connection string
- `DATABASE_NAME` - Database name
- `DATABASE_PASSWORD` - Database password
- `DATABASE_USER` - Database username
- `DATABASE_PORT` - Database port (usually 5432)

**Authentication:**
- `JWT_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)

**Email Service:**
- `RESEND_API_KEY` - Resend API key for email sending
- `RESEND_FROM_EMAIL` - Verified sender email address

**Application:**
- `FRONTEND_URL` - Frontend URL for email links (localhost:3000 for dev)

**Optional:**
- `CLEANUP_API_KEY` - API key for cleanup endpoint security

3. **Database Setup**
   ```bash
   npm run db:push    # Create tables
   npm run db:seed    # Add sample data
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Sample Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@blog.com` | `password123` |
| Editor | `editor@blog.com` | `password123` |
| User | `author@blog.com` | `password123` |

---

## 4. Database Schema

### Core Tables
- **users** - User accounts with roles and profiles
- **posts** - Blog posts with status (draft/published)
- **post_drafts** - Separate draft storage
- **categories** - Content categorization
- **post_categories** - Many-to-many post-category relationships
- **post_stats** - Engagement metrics
- **pending_registrations** - OTP verification system

### Key Relationships
- Users → Posts (one-to-many)
- Users → Post Drafts (one-to-many)
- Posts → Categories (many-to-many)
- Posts → Post Stats (one-to-one)

---

## 5. API Architecture (tRPC)

### Authentication Routes
- `auth.register` - OTP-based registration
- `auth.verifyOtp` - Complete registration
- `auth.login` - JWT token generation
- `auth.refresh` - Token refresh
- `auth.forgotPassword` - Password reset OTP
- `auth.resetPassword` - Complete password reset

### Content Routes
- `posts.list` - Paginated post listing with filters
- `posts.bySlug` - Single post retrieval
- `posts.create` - New post creation
- `posts.update` - Post editing
- `posts.delete` - Post removal
- `posts.publish` - Draft to published conversion

### Draft Routes
- `drafts.getMyDrafts` - User's draft listing
- `drafts.createDraft` - Save new draft
- `drafts.updateDraft` - Edit existing draft
- `drafts.deleteDraft` - Remove draft
- `drafts.getDraftById` - Single draft retrieval

### Admin Routes
- `admin.getUsers` - User management
- `admin.updateUserRole` - Role modification
- `admin.deleteUser` - User removal

---

## 6. Deployment Guide

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Set build command: `npm run build`
   - Set output directory: `.next`

2. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   RESEND_API_KEY=your_resend_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   CLEANUP_API_KEY=optional_cleanup_key
   ```

3. **Database Migration**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Automated Features**
   - Cron jobs run every 6 hours for cleanup
   - Health checks available at `/api/health`
   - File uploads stored in `/public/uploads`

### Alternative Deployments

**Railway:**
```bash
npm run build
npm start
```

**Docker:**
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

---

## 7. Development Workflow

### Database Operations
```bash
npm run db:generate    # Create migration files
npm run db:push        # Apply schema changes
npm run db:migrate     # Run pending migrations
npm run db:studio      # Open database GUI
npm run db:seed        # Populate with sample data
npm run db:reset       # Full reset (push + seed)
```

### Code Quality
```bash
npm run lint          # ESLint checking
npm run build         # Production build
npm run test:api      # API endpoint testing
```

### Cleanup Operations
```bash
npm run cleanup:expired-registrations  # Manual cleanup
# Automated via Vercel cron jobs
```

---

## 8. Key Technical Decisions

### Architecture Choices
- **Next.js App Router** - Modern routing with server components
- **tRPC** - Type-safe API layer eliminating REST boilerplate
- **Drizzle ORM** - Lightweight, type-safe database operations
- **JWT + Database Sessions** - Secure authentication with refresh tokens

### Security Measures
- **OTP-based Registration** - Prevents fake accounts
- **Rate Limiting** - API protection against abuse
- **Input Validation** - Zod schemas for all inputs
- **SQL Injection Protection** - Parameterized queries via Drizzle

### Performance Optimizations
- **Database Indexing** - Optimized queries for posts and users
- **Image Optimization** - Next.js automatic image processing
- **Code Splitting** - Route-based automatic splitting
- **Caching Strategy** - Database result caching

---

## 9. Testing Strategy

### API Testing
- Postman collection in `postman_collection.json`
- Covers all authentication and content endpoints
- Includes sample requests with proper headers

### Manual Testing Checklist
- [ ] User registration and OTP verification
- [ ] Login/logout functionality
- [ ] Password reset flow
- [ ] Post creation and editing
- [ ] Draft save/load functionality
- [ ] Category assignment
- [ ] Admin user management
- [ ] File upload validation
- [ ] Responsive design on mobile/desktop

---

## 10. Future Enhancements

### High Priority
- **Comments System** - User comments on posts
- **Social Sharing** - Share buttons and meta tags
- **Search Functionality** - Full-text search across posts
- **User Profiles** - Public author profiles
- **Email Notifications** - Post updates, mentions

### Medium Priority
- **Post Scheduling** - Publish posts at future dates
- **Revision History** - Track post changes
- **Bulk Operations** - Multi-select actions
- **Analytics Dashboard** - Detailed engagement metrics
- **API Rate Limiting** - Advanced protection

### Nice to Have
- **Multi-language Support** - Internationalization
- **Theme Customization** - User-selectable themes
- **Plugin System** - Extensible architecture
- **Import/Export** - Content migration tools
- **Advanced Editor** - Collaborative editing

---

## 11. Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL format
# For local: postgresql://user:pass@localhost:5432/dbname
# For cloud: includes ?sslmode=require
```

**Email Not Sending**
```bash
# Verify RESEND_API_KEY
# Check RESEND_FROM_EMAIL domain verification
# Test with Resend dashboard
```

**Build Failures**
```bash
npm run lint  # Check for TypeScript errors
npm run build # Ensure all dependencies installed
```

**Authentication Issues**
```bash
# Verify JWT_SECRET length (min 32 chars)
# Check token expiration settings
# Validate middleware configuration
```

---

## 12. Contributing Guidelines

1. **Code Style** - Follow existing TypeScript and ESLint rules
2. **Commits** - Use conventional commit format
3. **Testing** - Test all new features manually
4. **Documentation** - Update README for new features
5. **Database** - Create migrations for schema changes

---

*This platform demonstrates production-ready full-stack development with modern React, TypeScript, and database practices.*