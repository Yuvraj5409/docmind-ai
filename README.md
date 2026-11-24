
# DocMind AI

DocMind AI is an AI-powered document understanding and chat platform. It allows users to interact with AI through conversations and gain insights from their documents.

## Features

- **AI Chat:** Ask questions and receive AI-generated responses powered by Google Gemini.
- **Guest Chat:** Try the chat experience without creating an account.
- **User Authentication:** Register, log in, verify email addresses, and reset passwords.
- **Chat History:** Save, reopen, rename, and delete conversations.
- **Document Upload:** Upload PDF, JPG, and PNG files for document analysis.
- **Private Conversations:** Keep registered users' conversations private.

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- Google Gemini API
- Better Auth
- Prisma ORM
- PostgreSQL

## Getting Started

### Prerequisites

- Node.js and npm
- Docker Desktop
- Google Gemini API key
- Resend API key (for authentication emails)

### 1. Clone the repository

```bash
git clone https://github.com/Yuvraj5409/docmind-ai.git
cd docmind-ai
```

### 2. Install dependencies

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

### 3. Configure environment variables

Copy the example environment files:

- Copy `.env.example` to `.env` in the project root.
- Copy `backend/.env.example` to `backend/.env` if needed for your local Prisma workflow.

Fill in the required values in the root `.env` file:

- PostgreSQL credentials and `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `RESEND_API_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

For local development, the frontend and backend use:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

Never commit real API keys, passwords, or other secrets.

### 4. Start PostgreSQL

Make sure Docker Desktop is running, then execute:

```bash
docker compose up -d
```

### 5. Run database migrations

Open a terminal in the backend directory:

```bash
cd backend
npx prisma migrate deploy --config prisma7.config.ts
```

### 6. Start the backend

In the backend directory:

```bash
npm run dev
```

The backend runs at `http://localhost:4000`.

### 7. Start the frontend

Open a separate terminal in the project root:

```bash
npm run dev
```

The frontend runs at `http://localhost:3000`.

Open `http://localhost:3000` in your browser to use DocMind AI.

## Production Build

To build the backend:

```bash
cd backend
npm run build
```

To build the frontend, run from the project root:

```bash
npm run build
```

## Project Status

DocMind AI is under active development. Features and documentation may evolve as the project grows.

## License

No license has been specified yet.
