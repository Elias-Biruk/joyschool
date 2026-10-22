# Database Setup Guide

## PostgreSQL Requirements

JoyEdu requires PostgreSQL 16+ to run. The application uses Prisma ORM for database access.

## Installation

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the postgres user
4. Ensure pgAdmin 4 is installed (optional, for database management)

### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Database Creation

1. Connect to PostgreSQL:
```bash
psql -U postgres
```

2. Create the database:
```sql
CREATE DATABASE joyschool;
```

3. Create a dedicated user (recommended):
```sql
CREATE USER joyschool_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE joyschool TO joyschool_user;
```

4. Exit psql:
```sql
\q
```

## Environment Configuration

### Backend (.env)
Copy `.env.example` to `.env` in the backend directory:
```bash
cd backend
cp .env.example .env
```

Update the `DATABASE_URL` with your actual connection string:
```
DATABASE_URL="postgresql://joyschool_user:your_secure_password@localhost:5432/joyschool?schema=public"
```

Set secure JWT secrets (generate random strings at least 32 characters):
```
JWT_SECRET="generate-secure-random-string-min-32-chars"
JWT_REFRESH_SECRET="generate-secure-random-string-min-32-chars"
```

### Frontend (.env.local)
Copy `.env.example` to `.env.local` in the frontend directory:
```bash
cd frontend
cp .env.example .env.local
```

Update the API URL if needed (default is `http://localhost:3001/api`).

## Running Migrations

1. Generate Prisma Client:
```bash
cd backend
npx prisma generate
```

2. Run database migrations:
```bash
npx prisma migrate dev --name init
```

3. Seed the database with sample data (optional):
```bash
npx prisma db seed
```

## Verification

1. Check database connection:
```bash
npx prisma studio
```
This will open Prisma Studio in your browser to view and edit data.

2. Start the backend server:
```bash
npm run start:dev
```

3. Start the frontend server:
```bash
cd ../frontend
npm run dev
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check that the port (default 5432) is correct
- Verify the username and password in DATABASE_URL

### Migration Errors
- Drop and recreate the database if needed (WARNING: deletes all data):
```sql
DROP DATABASE joyschool;
CREATE DATABASE joyschool;
```
- Then re-run migrations

### Permission Errors
- Ensure the database user has proper privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE joyschool TO joyschool_user;
```

## Production Considerations

- Use environment-specific environment variables
- Use strong, randomly generated JWT secrets
- Enable SSL for database connections
- Set up regular database backups
- Use connection pooling (e.g., PgBouncer) for high traffic
- Monitor database performance and slow queries
