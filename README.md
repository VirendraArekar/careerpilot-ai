# CareerPilot AI

A production-style MERN + OpenAI career intelligence platform. The frontend is fully API-driven: no dashboard score, job match, application, interview result, conversation, cover letter, candidate ranking or profile value is hardcoded into a screen. The included seed command creates a realistic local workspace for **Virendra Minanath Arekar** and imports his current ATS resume.

## What is implemented

| Product area          | Working implementation                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication        | Register/login, configurable Google Identity sign-in, bcrypt password hashing, JWT, protected routes and candidate/recruiter/admin authorization |
| About Me              | Database-backed profile, editable biography/skills, real experience timeline, profile-photo upload and visible/downloadable resume               |
| Resume Studio         | PDF/DOCX/TXT ingestion, parsing, ATS section scoring, keyword gaps, OpenAI truthful improvements, history and optimized PDF export               |
| Job intelligence      | Recruiter-created jobs, search/filter, embedding + keyword recommendations, match explanations and salary/work-mode data                         |
| Cover letters         | Resume-grounded, job-specific OpenAI generation with tone selection, saved versions and copy action                                              |
| RAG assistant         | Resume chunking, embeddings, semantic retrieval, grounded answers, persistent conversations and displayed source excerpts                        |
| Interview Lab         | Company/role/round-specific question generation, answer-by-answer AI scoring, feedback, improved answers and score history                       |
| Coding Studio         | JavaScript/Java/SQL challenge workspace, saved submissions, AI correctness/edge-case review and complexity feedback                              |
| Application CRM       | Saved-to-offer/rejected pipeline, match score, next action and recruiter-controlled progression                                                  |
| Recruiter workspace   | Job publishing, owned-job metrics, cross-candidate application view and match-based candidate ranking                                            |
| Analytics             | Live counts, ATS readiness, interview results, pipeline chart, OpenAI calls and token usage                                                      |
| Production foundation | TypeScript, input validation, Helmet, CORS, rate limiting, central errors, Docker Compose, Kubernetes examples and tests                         |

The AI layer uses the OpenAI **Responses API**, sets `store: false`, records usage, supports strict JSON-schema output and never intentionally invents candidate facts. OpenAI recommends Responses for new projects and documents `text.format` for Structured Outputs.

## Repository layout

```text
careerpilot-ai/
├── frontend/                 React 19 + Vite + TypeScript + Tailwind CSS
│   └── src/
│       ├── api/              Axios client and auth interceptor
│       ├── components/       Reusable UI primitives
│       ├── context/          Authentication state
│       ├── hooks/            API loading helper
│       ├── layouts/          Responsive application shell
│       └── pages/            Eleven dynamic product screens
├── backend/                  Node.js + Express + TypeScript
│   └── src/
│       ├── config/           Environment and MongoDB connection
│       ├── controllers/      Feature-level HTTP orchestration
│       ├── middleware/       Auth, validation and errors
│       ├── models/           Mongoose domain models
│       ├── routes/           Versioned API routes and uploads
│       ├── services/         OpenAI, embeddings, ATS and document logic
│       ├── tests/            Unit tests
│       └── seed.ts           Virendra profile, resume and sample jobs
├── infra/                    Kubernetes example
└── docker-compose.yml        Frontend, backend and MongoDB
```

## Prerequisites

- Node.js 20 or newer (Node 22 LTS recommended)
- npm 10 or newer
- MongoDB 7 locally, or a MongoDB Atlas connection string
- OpenAI API key for real AI output
- Docker Desktop (optional, easiest full-stack startup)

## Local setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create the backend environment file:
## Formatting & code style

This repository includes a Prettier configuration to keep code style consistent across frontend and backend.

- Config files: `.prettierrc` and `.prettierignore` are included at the repository root.
- Format all supported files from the project root:

```bash
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md,html}"
# or use the workspace script
npm run format
```

For the frontend or backend only run:

```bash
cd frontend && npm run format
cd backend && npm run format
```

   ```bash
   cp .env.example backend/.env
   ```

3. Set at least these values in `backend/.env`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/careerpilot
   JWT_SECRET=replace-with-a-long-random-value
   OPENAI_API_KEY=sk-your-key
   OPENAI_MODEL=gpt-5.6
   GOOGLE_CLIENT_ID=your-google-web-client-id
   CLIENT_URL=http://localhost:5173
   ```

   Keep `OPENAI_API_KEY` on the backend only. Never add it to `frontend/.env` or commit it. `DEMO_AI_FALLBACK=true` makes every workflow navigable without a key, but resume rewriting, semantic embeddings and evaluations use real OpenAI output only when a valid key is configured.

   For Google sign-in, also copy `frontend/.env.example` to `frontend/.env`, set the same Google web client ID as `VITE_GOOGLE_CLIENT_ID`, and add `http://localhost:5173` to its authorized JavaScript origins. Email/password login works without this optional configuration.

4. Start MongoDB. With Docker:

   ```bash
   docker compose up mongodb -d
   ```

5. Seed Virendra's profile, latest resume and three sample jobs:

   ```bash
   npm run seed
   ```

6. Start both applications:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:5173`.

Seed login:

```text
Email:    virendra.arekar@gmail.com
Password: CareerPilot@123
```

Change the seed password in `backend/.env` before using any shared environment.

## Docker startup

Create `backend/.env`, then run:

```bash
docker compose up --build
docker compose exec backend node dist/seed.js
```

Frontend: `http://localhost:5173`  
Backend health: `http://localhost:5000/health`

## How the OpenAI workflows operate

### Resume analysis

1. Multer validates and stores the uploaded file.
2. `pdf-parse` or `mammoth` extracts normalized text.
3. A deterministic ATS service measures section completeness, impact signals and target keywords.
4. The OpenAI Responses API returns structured strengths, improvements and a truthful optimized version.
5. The raw analysis and optimized text are saved to MongoDB.
6. PDFKit creates the downloadable ATS-friendly PDF on demand.

### Job recommendations

The backend combines deterministic ATS keyword fit (70%) with embedding cosine similarity (30%). If embeddings are unavailable in demo mode, the deterministic score remains functional. At larger scale, replace the in-process comparison with a MongoDB Atlas Vector Search index on the existing `embedding` fields.

### RAG chat

The chosen resume is divided into overlapping chunks. The question and chunks are embedded, the four strongest chunks are retrieved, and only those excerpts are sent to the model. The answer and displayed citations are stored in the conversation record.

### AI safety rule

All generation instructions explicitly prohibit invented employment, education, credentials, skills and metrics. Users must still review generated material before sending it to an employer.

## Useful scripts

| Command                   | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start API and frontend together          |
| `npm run build`           | Type-check and build both applications   |
| `npm test`                | Run backend and frontend test suites     |
| `npm run seed`            | Upsert the demo profile, resume and jobs |
| `npm run dev -w backend`  | Start only Express API                   |
| `npm run dev -w frontend` | Start only Vite                          |

## Principal API routes

| Method and route                                      | Purpose                                   |
| ----------------------------------------------------- | ----------------------------------------- |
| `POST /api/auth/register`, `POST /api/auth/login`     | Authentication                            |
| `POST /api/auth/google`                               | Verified Google Identity credential login |
| `GET/PATCH /api/profile`                              | Current About Me data                     |
| `POST /api/profile/photo`, `POST /api/profile/resume` | Profile assets                            |
| `GET/POST /api/resumes`                               | Resume history and analysis               |
| `POST /api/resumes/:id/analyse`                       | Re-run against a target job               |
| `GET /api/resumes/:id/download`                       | Optimized PDF                             |
| `GET /api/jobs/recommendations`                       | Ranked semantic job matches               |
| `POST /api/jobs/:id/apply`                            | Create/update an application              |
| `GET/PATCH /api/applications/:id`                     | Application pipeline                      |
| `POST /api/assistant/chat`                            | RAG conversation                          |
| `POST /api/cover-letters`                             | Generate a cover letter                   |
| `POST /api/interviews`                                | Generate a mock round                     |
| `POST /api/interviews/:id/answer`                     | Evaluate an answer                        |
| `POST /api/coding/challenges/:id/evaluate`            | Review code                               |
| `GET /api/analytics/dashboard`                        | Candidate dashboard                       |
| `GET /api/analytics/recruiter`                        | Recruiter dashboard                       |

## Testing and production checklist

```bash
npm test
npm run build
```

Before production:

- Use a secrets manager for `OPENAI_API_KEY` and `JWT_SECRET`.
- Put uploads in private S3/object storage and issue time-limited URLs.
- Add malware scanning for uploaded files.
- Use refresh-token rotation or an external identity provider.
- Replace local embedding comparison with Atlas Vector Search for large datasets.
- Put long-running analysis into Redis/BullMQ workers.
- Use a purpose-built isolated code runner for untrusted code; the included Coding Studio performs model-based static review and does not execute candidate code on the API host.
- Add organization/tenant IDs before serving multiple recruiter organizations.
- Configure monitoring, backups, TLS, privacy retention and deletion policies.

## Personalization

The seed uses Virendra's current senior full-stack profile and `Virendra_Arekar_ATS_Java_Node_AI_Resume.pdf`. A photo is intentionally not fabricated. Upload the correct image from **About Me → camera button**; it is immediately stored, returned by the profile API and displayed throughout the interface.

## License

Private portfolio project. Add your preferred license before public distribution.
