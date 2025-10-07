# TapOrder MVP

A modern restaurant ordering system built with Express, TypeScript, and Next.js.

## Tech Stack

- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Frontend**: Next.js, Tailwind CSS
- **Payments**: Stripe
- **SMS**: Twilio
- **Development**: Hot reload, TypeScript compilation

## Project Structure

```
TapOrder/
├── src/                    # Backend Express server
│   └── index.ts           # Main server file
├── prisma/                # Database schema and migrations
├── frontend/              # Next.js frontend application
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── .env                   # Environment variables
```

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd TapOrder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/taporder"
PORT=3000
# Add other environment variables as needed
```

### 4. Generate Prisma client
```bash
npx prisma generate
```

### 5. Start the development server
```bash
npm run dev
```

### 6. Verify the setup
Open your browser and navigate to:
- Backend API: `http://localhost:3000/health`
- You should see: `{"status":"ok"}`

## Development Notes

### Database Management
- **View data**: `npx prisma studio` - Opens Prisma Studio in your browser
- **Apply migrations**: `npx prisma migrate dev` - Run after schema changes
- **Reset database**: `npx prisma migrate reset` - Reset and apply all migrations

### Code Quality
- **Lint code**: `npm run lint` - Check for code quality issues
- **Fix linting**: `npm run lint:fix` - Automatically fix linting issues

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## API Endpoints

- `GET /health` - Health check endpoint

## Contributing

1. Make your changes
2. Run `npm run lint` to check code quality
3. Test your changes with `npm run dev`
4. Commit your changes

## License

ISC
