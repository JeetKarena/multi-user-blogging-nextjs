# 🚀 Multi-User Blogging Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![tRPC](https://img.shields.io/badge/tRPC-11.6.0-pink?style=for-the-badge&logo=trpc)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.15-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

A modern, full-stack blogging platform built with cutting-edge technologies. Features multi-user authentication, rich text editing, draft management, and a beautiful responsive UI.

## ✨ Features

### 🔐 Authentication & Security
- **OTP-based Registration** - Secure email verification for new users
- **JWT Authentication** - Access and refresh tokens for session management
- **Role-based Access Control** - Admin, Editor, and User roles with different permissions
- **Password Reset** - Secure OTP-based password recovery

### 📝 Content Management
- **Rich Text Editor** - TipTap-powered WYSIWYG editor with image support
- **Draft System** - Save posts as drafts and publish when ready
- **Category Management** - Organize posts with customizable categories
- **Post Statistics** - Track views, likes, and comments
- **SEO Optimization** - Meta titles and descriptions for better search visibility

### 🎨 User Experience
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark Mode Support** - Automatic theme switching
- **Modern UI Components** - shadcn/ui component library
- **Real-time Feedback** - Toast notifications and loading states
- **Image Upload** - Local file upload with validation

### 🛠️ Developer Experience
- **Type-Safe APIs** - End-to-end type safety with tRPC
- **Database Migrations** - Drizzle ORM with schema versioning
- **Health Monitoring** - Built-in health check endpoints
- **Automated Cleanup** - Cron jobs for database maintenance
- **API Testing** - Postman collection included

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** database ([Local](https://www.postgresql.org/download/) or [Cloud](https://neon.tech/))
- **Git** ([Download](https://git-scm.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/blogging-platform.git
   cd blogging-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/blogging_platform"

   # Authentication
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-here"

   # Email Service (Resend)
   RESEND_API_KEY="your-resend-api-key"
   RESEND_FROM_EMAIL="noreply@yourdomain.com"

   # Optional: API Key for cleanup endpoint
   CLEANUP_API_KEY="your-cleanup-api-key"
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   npm run db:push

   # Seed with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Management

```bash
# Generate migrations
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Reset database (push schema + seed data)
npm run db:reset

# Full clean setup (push + migrate + seed)
npm run db:clean
```

## 🧹 Automated Cleanup

The platform includes automated cleanup for expired OTP registrations:

### Manual Cleanup
```bash
npm run cleanup:expired-registrations
```

### Automated Cleanup (Recommended)

**Option 1: Vercel Cron Jobs**
```json
{
  "crons": [
    {
      "path": "/api/cleanup/expired-registrations",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Option 2: GitHub Actions**
Create `.github/workflows/cleanup.yml`:
```yaml
name: Cleanup Expired Registrations
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run cleanup:expired-registrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 🧪 API Testing

Use the included Postman collection (`postman_collection.json`) to test API endpoints.

### Sample User Accounts

After running the seed script, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@blog.com` | `password123` |
| Editor | `editor@blog.com` | `password123` |
| Author | `author@blog.com` | `password123` |

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── blog/              # Blog listing and detail pages
│   ├── dashboard/         # User dashboard
│   ├── posts/             # Post creation and editing
│   └── ...
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── blog/             # Blog-specific components
│   └── ...
├── lib/                   # Core utilities
│   ├── auth/             # Authentication logic
│   ├── db/               # Database configuration
│   ├── services/         # Business logic services
│   └── utils/            # Helper functions
├── server/                # tRPC server setup
│   ├── context.ts        # tRPC context
│   ├── middleware.ts     # tRPC middleware
│   └── routers/          # tRPC route handlers
└── types/                 # TypeScript type definitions

scripts/                   # Database and utility scripts
├── seed.ts               # Database seeding
├── migrate.ts            # Migration runner
└── cleanup-expired-registrations.ts

public/                   # Static assets
├── images/               # Image assets
└── uploads/              # User uploaded files
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to [Vercel](https://vercel.com)
2. **Add environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `CLEANUP_API_KEY` (optional)

3. **Deploy** - Vercel will automatically build and deploy your app

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test:api     # Run API tests
```

### Code Quality

- **ESLint** - Code linting and formatting
- **TypeScript** - Strict type checking
- **Prettier** - Code formatting (via ESLint)

### Database Development

- **Drizzle Studio** - Visual database management
- **Schema Migrations** - Version-controlled database changes
- **Seed Scripts** - Consistent development data

## 📈 Performance Optimizations

The platform includes several performance optimizations:

- **Database Indexing** - Optimized queries with proper indexes
- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Automatic route-based code splitting
- **Caching** - Database query result caching
- **Lazy Loading** - Component and image lazy loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [tRPC](https://trpc.io/) - Type-safe APIs
- [Drizzle ORM](https://orm.drizzle.team/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TipTap](https://tiptap.dev/) - Rich text editor
- [Resend](https://resend.com/) - Email service

---

**Built with ❤️ using modern web technologies**
