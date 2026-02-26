# AI-Driven Ticket Booking System

A modern ticket booking application built with Next.js, Supabase, and Tailwind CSS.

## Prerequisites

- Node.js 18+ and npm
- Supabase account with a project created

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-driven-ticket-booking
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings.

## Running the Project

### Development Mode
Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build
Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Linting
Run the linter:
```bash
npm run lint
```

## Project Structure

- `app/` - Next.js application pages and API routes
- `components/` - React components
- `lib/` - Utility functions and Supabase client setup
- `public/` - Static assets
- `scripts/` - Database migration scripts
- `styles/` - Global styles

## Database Setup

Run the migration scripts in order:
1. `001_create_cinema_schema.sql`
2. `002_seed_cinema_data.sql`
3. `003_create_wallet_system.sql`
4. `004_create_prebooking_system.sql`
5. `005_add_future_showtimes.sql`

Execute these in your Supabase SQL editor.

## Features

- Movie browsing and filtering
- Seat selection and booking
- User authentication with Supabase
- Wallet system for users
- Pre-booking functionality
- Booking history and confirmation

## Technologies Used

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Components**: Radix UI
- **Forms**: React Hook Form
- **Validation**: Zod

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, the dev server will automatically use port 3001.

### Missing Environment Variables
Make sure `.env.local` is created and populated with your Supabase credentials.

### Build Errors
Clear the build cache:
```bash
rm -rf .next
npm run build
```

## License

MIT
