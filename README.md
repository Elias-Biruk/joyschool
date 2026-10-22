# JoyEdu — Online Learning Platform

A production-oriented online learning platform inspired by W3Schools and Coursera, enabling students to learn through structured courses, interactive lessons, quizzes, assignments, and progress tracking.

## Tech Stack

### Frontend
- **Next.js 14+** with TypeScript and App Router
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Axios** for API calls
- **React Hook Form** with Zod validation

### Backend
- **NestJS 10+** with TypeScript
- **Prisma ORM** for database access
- **PostgreSQL** database
- **JWT** for authentication
- **Passport** for authentication strategies
- **class-validator** for DTO validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL 16+
- npm or yarn

## Project Structure

```
joyschool/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/
│   │   ├── contexts/
│   │   └── lib/
│   └── package.json
├── backend/           # NestJS backend application
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── users/    # Users module
│   │   ├── courses/  # Courses module
│   │   ├── categories/
│   │   ├── enrollments/
│   │   ├── lessons/
│   │   ├── progress/
│   │   └── prisma/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── ROADMAP.md
├── IMPLEMENTATION_STATUS.md
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd joyschool
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

Create a `.env` file in the backend directory (copy from `.env.example`):

```env
DATABASE_URL="postgresql://username:password@localhost:5432/joyschool?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migrations:

```bash
npm run prisma:migrate
```

Seed the database (optional, for development):

```bash
npm run prisma:seed
```

Start the backend server:

```bash
npm run start:dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Default Users (after seeding)

After running the seed script, you can use these default accounts:

### Admin
- Email: `admin@joyschool.com`
- Password: `Admin123!`

### Teacher
- Email: `teacher@joyschool.com`
- Password: `Teacher123!`

### Student
- Email: `student@joyschool.com`
- Password: `Student123!`

## Available Scripts

### Backend

```bash
npm run start              # Start production server
npm run start:dev          # Start development server with hot reload
npm run start:debug        # Start in debug mode
npm run build              # Build for production
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:seed        # Seed database with sample data
npm run prisma:studio      # Open Prisma Studio
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
```

### Frontend

```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Categories
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Create category (Admin only)
- `PUT /api/v1/categories/:id` - Update category (Admin only)
- `DELETE /api/v1/categories/:id` - Delete category (Admin only)

### Courses
- `GET /api/v1/courses` - List courses with pagination and filters
- `GET /api/v1/courses/:id` - Get course by ID
- `GET /api/v1/courses/slug/:slug` - Get course by slug
- `POST /api/v1/courses` - Create course (Teacher/Admin)
- `PUT /api/v1/courses/:id` - Update course (Teacher/Admin)
- `DELETE /api/v1/courses/:id` - Delete course (Teacher/Admin)
- `POST /api/v1/courses/:id/publish` - Publish course (Teacher/Admin)
- `POST /api/v1/courses/:id/unpublish` - Unpublish course (Teacher/Admin)

### Enrollments
- `POST /api/v1/enrollments` - Enroll in a course
- `GET /api/v1/enrollments/my-enrollments` - Get user's enrollments
- `GET /api/v1/enrollments/course/:courseId` - Get course enrollments (Teacher)
- `GET /api/v1/enrollments/:id` - Get enrollment details
- `DELETE /api/v1/enrollments/:id` - Cancel enrollment

### Lessons
- `GET /api/v1/lessons/:id` - Get lesson by ID
- `POST /api/v1/lessons` - Create lesson (Teacher/Admin)
- `PUT /api/v1/lessons/:id` - Update lesson (Teacher/Admin)
- `DELETE /api/v1/lessons/:id` - Delete lesson (Teacher/Admin)

### Progress
- `POST /api/v1/progress` - Create or update lesson progress
- `GET /api/v1/progress` - Get user's progress
- `GET /api/v1/progress/lesson/:lessonId` - Get lesson progress
- `GET /api/v1/progress/course/:courseId` - Get course progress

## Database Schema

The platform uses a normalized PostgreSQL database with the following main models:

- **User** - User accounts with roles (Student, Teacher, Admin)
- **CourseCategory** - Hierarchical course categorization
- **Course** - Published and draft courses
- **CourseModule** - Organizational units within courses
- **Lesson** - Individual learning units
- **Enrollment** - Student-course relationships
- **LessonProgress** - Student lesson completion tracking
- **Bookmark** - Student-saved lessons
- **LearningNote** - Student personal notes
- **Quiz** - Course assessments
- **Question** - Quiz questions
- **AnswerOption** - Multiple-choice options
- **QuizAttempt** - Student quiz attempts
- **Assignment** - Course assignments
- **AssignmentSubmission** - Student submissions
- **Certificate** - Completion certificates
- **Notification** - User notifications
- **Announcement** - Platform announcements
- **AuditLog** - Administrative action tracking

See `backend/prisma/schema.prisma` for the complete schema.

## Current Status

### Completed (Phases 1-14 - Foundation, Core Features & Production Ready)
- ✅ Project initialization and configuration
- ✅ Database schema design with 20+ models
- ✅ Authentication system (JWT, registration, login, password reset)
- ✅ Role-based access control and guards
- ✅ Course catalog API with search, filter, pagination
- ✅ Course management API (CRUD, publish/unpublish)
- ✅ Enrollment system API
- ✅ Lesson management API
- ✅ Progress tracking API
- ✅ Category management API
- ✅ All TypeScript errors fixed (backend and frontend)
- ✅ Database setup documentation
- ✅ Frontend authentication pages (login, register)
- ✅ Frontend landing page
- ✅ Frontend course catalog with search and filters
- ✅ Frontend course details page
- ✅ Student dashboard with enrolled courses and progress
- ✅ Teacher dashboard with course management
- ✅ Lesson viewer with video, content, and progress tracking
- ✅ Admin dashboard UI with real backend API integration
- ✅ Interactive coding playground with Monaco Editor
- ✅ Quiz system (backend and frontend)
- ✅ Assignment system (backend and frontend)
- ✅ Teacher grading interface
- ✅ Lesson navigation (previous/next) and curriculum sidebar
- ✅ Security hardening (rate limiting, XSS protection)
- ✅ Swagger/OpenAPI documentation
- ✅ Automated tests (all passing)
- ✅ Production builds verified
- ✅ PostgreSQL 17 installed and configured
- ✅ Database migrations applied successfully
- ✅ Seed data loaded
- ✅ E2E tests passing against real database
- ✅ API workflows verified (enrollment, progress)
- ✅ Password complexity requirements enforced
- ✅ Failed login tracking implemented

### Production Ready
**READY FOR PRODUCTION DEPLOYMENT**

All critical acceptance criteria verified. See `DEPLOYMENT.md` for production setup instructions and `IMPLEMENTATION_STATUS.md` for detailed verification results.

### Remaining for Production
- Set up production PostgreSQL instance with TLS
- Configure production secrets manager
- Add `sslmode=require` to DATABASE_URL
- Set up monitoring and alerting
- Configure production CI/CD pipeline

## Known Issues

- Some npm dependency vulnerabilities remain (transitive dependencies in jest and monaco-editor)
- Failed login tracking uses in-memory storage - consider Redis for distributed deployments
- Database TLS configuration requires production database setup with SSL certificates

## Development Notes

### Running Migrations
Before running the application for the first time, ensure PostgreSQL is running and execute:

```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
```

### API Versioning
All API endpoints are prefixed with `/api/v1` to support future versioning.

### Authentication
The application uses JWT tokens with refresh tokens for secure authentication. Tokens are stored in localStorage on the frontend.

### Role-Based Access
- **Students** can enroll in courses, view lessons, track progress
- **Teachers** can create and manage their courses, grade assessments
- **Admins** can manage users, moderate content, view platform analytics

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

UNLICENSED

## Support

For issues and questions, please refer to the ROADMAP.md and IMPLEMENTATION_STATUS.md files.
