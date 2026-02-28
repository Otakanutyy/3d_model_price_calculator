# 3D Model Price Calculator

A full-stack web service for calculating the manufacturing cost of 3D-printed parts. Users upload 3D models (STL/OBJ/3MF), configure production parameters, and get an automatic price breakdown. Includes AI-powered text generation for commercial descriptions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Three.js |
| Backend | FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic |
| Worker | Celery, trimesh |
| Database | PostgreSQL 16 |
| Cache/Broker | Redis 7 |
| AI | OpenAI GPT-4o |
| Infra | Docker Compose (5 services) |

## Prerequisites

- **Docker** & **Docker Compose** (v2)
- An **OpenAI API key** (optional — only needed for AI text generation)

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/Otakanutyy/3d_model_price_calculator.git
```

``` bash
cd 3d_model_price_calculator
```
```bash
cp .env.example .env
```

Edit `.env` and set your `OPENAI_API_KEY` (leave blank to skip AI features).

### 2. Start all services

```bash
docker-compose up --build -d
```

This starts 5 containers:

| Service | Port | Description |
|---------|------|-------------|
| `db` | 5432 | PostgreSQL |
| `redis` | 6379 | Redis |
| `server` | 8000 | FastAPI backend (runs Alembic migrations on startup) |
| `worker` | — | Celery worker for 3D model processing |
| `client` | 5173 | Vite dev server (React frontend) |

### 3. Open the app

Go to **http://localhost:5173** in your browser.

## Testing the Full Workflow

### Via the UI

1. **Register** — Go to http://localhost:5173/register, create an account.
2. **Login** — You'll be redirected to the projects list.
3. **Create a project** — Click "New Project", enter a name.
4. **Open the project** — Click on the project card.
5. **Upload a 3D model** — Drag & drop (or click) to upload an STL/OBJ/3MF file. The model will be processed in the background and rendered in the 3D viewer.
6. **Configure parameters** — Adjust technology, material, print settings, and economics in the left panel.
7. **Calculate price** — Click "Calculate" in the right panel to see the full cost breakdown.
8. **Generate AI text** — (Section 6, if implemented) Generate a commercial description.

### Via curl (API)

All API endpoints are under `/api`. Below is a full manual test sequence.

#### Auth

```bash
# Register
curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'

# Login — save the access token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo $TOKEN
```

#### Projects

```bash
# Create a project
curl -s -X POST http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Part"}'

# List projects
curl -s http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN"

# Get project detail (replace <PROJECT_ID>)
curl -s http://localhost:8000/api/projects/<PROJECT_ID> \
  -H "Authorization: Bearer $TOKEN"

# Update project
curl -s -X PATCH http://localhost:8000/api/projects/<PROJECT_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"client": "ACME Corp", "notes": "Prototype run"}'

# Delete project
curl -s -X DELETE http://localhost:8000/api/projects/<PROJECT_ID> \
  -H "Authorization: Bearer $TOKEN"
```

#### 3D Model Upload & Processing

```bash
# Upload a model (STL/OBJ/3MF)
curl -s -X POST http://localhost:8000/api/projects/<PROJECT_ID>/model \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/model.stl"

# Poll processing status (repeats until status is "done" or "error")
curl -s http://localhost:8000/api/projects/<PROJECT_ID>/model/status \
  -H "Authorization: Bearer $TOKEN"

# Download the model file
curl -s http://localhost:8000/api/projects/<PROJECT_ID>/model/file \
  -H "Authorization: Bearer $TOKEN" -o model.stl

# Delete model
curl -s -X DELETE http://localhost:8000/api/projects/<PROJECT_ID>/model \
  -H "Authorization: Bearer $TOKEN"
```

#### Calculation Parameters & Results

```bash
# Get params (auto-creates defaults on first call)
curl -s http://localhost:8000/api/projects/<PROJECT_ID>/params \
  -H "Authorization: Bearer $TOKEN"

# Update params
curl -s -X PATCH http://localhost:8000/api/projects/<PROJECT_ID>/params \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"infill": 30, "quantity": 5, "markup": 1.5}'

# Run calculation
curl -s http://localhost:8000/api/projects/<PROJECT_ID>/calculation \
  -H "Authorization: Bearer $TOKEN"
```

#### AI Text Generation

```bash
# Generate AI description (requires OPENAI_API_KEY in .env)
curl -s -X POST http://localhost:8000/api/projects/<PROJECT_ID>/ai-generate \
  -H "Authorization: Bearer $TOKEN"

# Get saved AI text
curl -s http://localhost:8000/api/projects/<PROJECT_ID>/ai-text \
  -H "Authorization: Bearer $TOKEN"
```

## Project Structure

```
├── .env.example            # Environment variables template
├── docker-compose.yml      # All 5 services
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # App entry, router registration
│   │   ├── config.py       # Pydantic settings
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── routers/        # API route handlers
│   │   │   ├── auth.py     # Register, login, refresh
│   │   │   ├── projects.py # CRUD for projects
│   │   │   ├── models.py   # 3D file upload, status, download, delete
│   │   │   ├── calc.py     # Params CRUD + run calculation
│   │   │   └── ai.py       # AI text generation
│   │   ├── services/       # Business logic
│   │   │   ├── calculation.py  # Price calculation engine
│   │   │   └── ai_service.py   # OpenAI integration
│   │   └── dependencies/   # DI (database, auth)
│   ├── alembic/            # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
├── worker/                 # Celery background worker
│   ├── tasks/
│   │   ├── celery_app.py   # Celery configuration
│   │   └── process_model.py # 3D model parsing with trimesh
│   ├── requirements.txt
│   └── Dockerfile
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/client.ts   # Axios instance with JWT interceptor
│   │   ├── store/          # Zustand stores (auth, projects, projectDetail)
│   │   ├── components/     # Navbar, Viewer3D, FileUpload, ParamsForm, CalcResult, ProjectHeader
│   │   ├── pages/          # Login, Register, ProjectList, ProjectDetail
│   │   └── types/index.ts  # TypeScript interfaces
│   ├── package.json
│   └── Dockerfile
└── README.md
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project detail |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/model` | Upload 3D model |
| GET | `/api/projects/:id/model/status` | Poll processing status |
| GET | `/api/projects/:id/model/file` | Download model file |
| DELETE | `/api/projects/:id/model` | Delete model |
| GET | `/api/projects/:id/params` | Get calc parameters |
| PATCH | `/api/projects/:id/params` | Update calc parameters |
| GET | `/api/projects/:id/calculation` | Run calculation |
| POST | `/api/projects/:id/ai-generate` | Generate AI text |
| GET | `/api/projects/:id/ai-text` | Get saved AI text |

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | DB user |
| `POSTGRES_PASSWORD` | `postgres` | DB password |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async DB connection |
| `REDIS_URL` | `redis://redis:6379/0` | Celery broker |
| `JWT_SECRET_KEY` | — | **Change in production** |
| `OPENAI_API_KEY` | — | Required for AI features |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model to use |
| `UPLOAD_DIR` | `/uploads` | Shared volume for 3D files |

## Stopping

```bash
docker-compose down          # stop containers
docker-compose down -v       # stop + remove volumes (deletes DB data)
```
