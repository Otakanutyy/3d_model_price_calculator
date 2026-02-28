# Plan: 3D Model Price Calculator

## Tech Stack

| Layer | Choice | Rationale (job description alignment) |
|-------|--------|---------------------------------------|
| **Backend** | Python + FastAPI | JD: "Python, REST API" |
| **Database** | PostgreSQL (SQLAlchemy + Alembic) | JD: "PostgreSQL, schemas, migrations" |
| **Queue** | Redis + Celery | JD: "Redis + queues/broker" |
| **Frontend** | React + TypeScript + Vite | Modern SPA, reactive auto-calc |
| **3D Viewer** | Three.js (react-three-fiber) | STL/OBJ/3MF rendering |
| **3D Analysis** | Celery worker + numpy/trimesh (parse STL/OBJ/3MF → volume, bbox, polygon count) | Background processing |
| **LLM** | OpenAI API (GPT-4o) | JD: "AI/LLM experience" |
| **Auth** | JWT (access + refresh tokens, python-jose) | Simple, stateless |
| **Containers** | Docker + docker-compose | JD: "Docker" |
| **File Storage** | Local disk (`/uploads`), abstracted for future S3 | Simple start, production-ready interface |

## Architecture Overview

```
┌─────────────┐       ┌──────────────────┐       ┌───────────┐
│  React SPA  │──────▶│  FastAPI         │──────▶│ PostgreSQL│
│  (Vite)     │◀──────│  (REST + JWT)    │──────▶│           │
└─────────────┘       └────────┬─────────┘       └───────────┘
                               │
                        ┌──────▼──────┐
                        │  Redis      │
                        │  (Celery)   │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │  Celery     │
                        │  Worker     │
                        └─────────────┘
```

## Implementation Sections (each = one run)

---

### Section 1 — Backend Core: Infrastructure + Auth + Projects CRUD

**Goal:** Fully working backend skeleton — runnable with Docker, with auth and project management.

- [ ] FastAPI project scaffold (`server/app/`)
- [ ] `docker-compose.yml`: PostgreSQL, Redis, FastAPI server (hot-reload via volume mount)
- [ ] `.env` / `.env.example`, `pydantic-settings` config
- [ ] SQLAlchemy models for **all** tables: User, Project, Model, CalcParams, CalcResult, AiText
- [ ] Alembic init + initial migration
- [ ] **Auth endpoints:**
  - `POST /api/auth/register` (passlib/bcrypt)
  - `POST /api/auth/login` → JWT access + refresh (python-jose)
  - `POST /api/auth/refresh`
  - Auth dependency (`get_current_user`)
- [ ] **Projects CRUD:**
  - `GET /api/projects` — user's projects list
  - `POST /api/projects` — create
  - `GET /api/projects/{id}` — full project with nested model/params/result/ai
  - `PATCH /api/projects/{id}` — update name, client, contact, notes
  - `DELETE /api/projects/{id}`
- [ ] Error handling middleware, CORS setup
- [ ] Health-check endpoint `GET /api/health`

**Deliverable:** `docker-compose up` → Postgres + Redis + API running. Auth & CRUD testable via curl/Postman.

---

### Section 2 — File Upload + Celery Worker + 3D Model Parsing

**Goal:** Upload a 3D file → background analysis via Celery → results stored in DB.

- [ ] **Upload endpoint:** `POST /api/projects/{id}/model` (multipart, STL/OBJ/3MF)
- [ ] File saved to `/uploads/{project_id}/`, DB record created with status `queued`
- [ ] **Celery setup:**
  - `worker/` package with `celery_app.py` config (Redis broker)
  - Add `celery-worker` service to `docker-compose.yml`
- [ ] **`process_model` Celery task:**
  - Load file with **trimesh** (native STL/OBJ/3MF support)
  - Extract: bounding box (dim_x/y/z), volume, face count (polygons)
  - Update DB: status → `done`, store analysis results
  - On failure: status → `error`, store error_message
- [ ] **Status & file endpoints:**
  - `GET /api/projects/{id}/model/status` — returns status + analysis data
  - `GET /api/projects/{id}/model/file` — serves the raw file (for 3D viewer)
- [ ] Model re-upload: replaces previous file & re-queues analysis

**Deliverable:** Upload STL → Celery worker processes → `GET status` returns dimensions/volume/polygons.

---

### Section 3 — Calculation Engine + LLM Service

**Goal:** All server-side business logic — price calculation and AI text generation.

- [ ] **Calc params endpoints:**
  - `GET /api/projects/{id}/params` — current params (with defaults)
  - `PATCH /api/projects/{id}/params` — save/update params
- [ ] **Calculation engine** (pure Python module, Pydantic I/O):
  - `weight = volume × infill% × density`
  - `materialCost = weight × pricePerUnit × wasteFactor`
  - `energyCost = printTime × energyRate`
  - `depreciation = printTime × depreciationRate`
  - `prepCost = (modelingTime + postProcessingTime) × hourlyRate`
  - `rejectCost = unitCost × rejectRate`
  - `unitCost = materialCost + energyCost + depreciation + prepCost + rejectCost`
  - `profit = unitCost × markup`
  - `tax = (unitCost + profit) × taxRate`
  - `pricePerUnit = unitCost + profit + tax`
  - `totalPrice = pricePerUnit × quantity`
- [ ] **Calc result endpoint:**
  - `GET /api/projects/{id}/calculation` — runs engine, returns full breakdown
  - Result also persisted to `CalcResult` table
- [ ] **LLM integration:**
  - `POST /api/projects/{id}/ai-generate`
  - Build prompt from project info + calc result
  - Call OpenAI API (GPT-4o) → description + commercial text
  - Save to `AiText` table
  - `GET /api/projects/{id}/ai-text` — retrieve saved AI text

**Deliverable:** Full backend API complete. All endpoints working. Testable end-to-end via curl.

---

### Section 4 — Frontend: Foundation + Auth + Project List

**Goal:** Working React app with login, registration, and project management.

- [ ] Vite + React + TypeScript scaffold (`client/`)
- [ ] Tailwind CSS setup
- [ ] Routing: React Router (`/login`, `/register`, `/projects`, `/projects/:id`)
- [ ] **API client:** axios instance with JWT interceptor (attach token, auto-refresh on 401)
- [ ] **Auth pages:**
  - Login page (email + password → store tokens)
  - Register page
  - Route guard (redirect to `/login` if unauthenticated)
- [ ] **Project list page:**
  - Fetch & display user's projects (name, date, client)
  - Create new project (modal or inline form)
  - Delete project
  - Click → navigate to project detail
- [ ] **State management:** zustand store for auth + projects
- [ ] **Layout:** top navbar (logo, user name, logout), clean product-grade styling
- [ ] Add `client` to `docker-compose.yml` (Vite dev server, proxied API)

**Deliverable:** `docker-compose up` → full stack running. User can register, login, create/view/delete projects.

---

### Section 5 — Frontend: Project Detail Page (3D Viewer + Params + Calc)

**Goal:** The main project page — three-column layout with full functionality.

- [ ] **Three-column layout:** Parameters (left) | 3D Viewer (center) | Calculation Result (right)
- [ ] **3D Viewer component (react-three-fiber):**
  - Load STL/OBJ/3MF from API
  - OrbitControls: rotate, zoom, pan
  - Reset view button
  - Status overlay: processing / error / empty states
  - Model info display (dimensions, volume, polygons)
- [ ] **File upload UI:**
  - Drag-and-drop or click-to-upload zone
  - Format validation (STL/OBJ/3MF)
  - Upload progress indicator
  - Poll for processing status until done
- [ ] **Parameters form (left column):**
  - Technology selector (FDM / SLA / Metal)
  - Material fields (density, price, waste factor)
  - Print params (infill %, supports %, print time, post-processing time, modeling time)
  - Economics (quantity, batch toggle, markup, reject rate, tax, depreciation, energy rate)
  - Currency & language selectors
  - Auto-save on change (debounced PATCH)
- [ ] **Calculation result (right column):**
  - Auto-fetch on any param change
  - Full cost breakdown display: weight, material, energy, depreciation, prep, reject, unit cost, profit, tax, price per unit, total batch price
  - Clear visual hierarchy (not a raw table)
- [ ] **Project header:** editable name, client, contact, notes

**Deliverable:** Full project workflow in the browser — upload model, see 3D preview, set params, see live price breakdown.

---

### Section 6 — AI Panel + i18n + Polish + Docker Production

**Goal:** Final features, internationalization, and production-ready Docker setup.

- [ ] **AI panel (in project detail):**
  - "Generate AI Description" button
  - Loading state while OpenAI processes
  - Display: part description + commercial text
  - Editable / regeneratable
  - Saved & restored on project reload
- [ ] **i18n (react-i18next):**
  - EN + RU translation files
  - Language toggle in UI (header or settings)
  - All labels, placeholders, statuses translated
- [ ] **Currency formatting:**
  - Selector (USD, EUR, RUB, etc.)
  - Prices formatted per locale
- [ ] **UI polish:**
  - Responsive layout (collapse columns on small screens)
  - Consistent spacing, typography, color scheme
  - Empty states, error toasts, loading skeletons
  - Product-grade feel (not admin panel)
- [ ] **Docker production:**
  - Multi-stage Dockerfiles (server, worker, client)
  - Nginx for frontend serving + API proxy
  - `docker-compose.yml` production profile
  - Health checks on all services
  - Graceful shutdown handling
- [ ] `.env.example` with all config vars
- [ ] `README.md` with full setup & usage instructions
- [ ] Basic logging (structlog / uvicorn)

**Deliverable:** Complete, production-ready application. `docker-compose up` → everything works end-to-end.

## Database Schema (SQLAlchemy + Alembic — key models)

```
User          { id, email, password_hash, created_at }
Project       { id, user_id, name, date, client, contact, notes, created_at, updated_at }
Model         { id, project_id, filename, original_name, format, status, 
                dim_x, dim_y, dim_z, volume, polygons, error_message, created_at }
CalcParams    { id, project_id, technology, material_density, material_price, 
                waste_factor, infill, support_percent, print_time_h, post_process_time_h, 
                modeling_time_h, quantity, is_batch, markup, reject_rate, tax_rate, 
                depreciation_rate, energy_rate, currency, language }
CalcResult    { id, project_id, weight, material_cost, energy_cost, depreciation, 
                prep_cost, reject_cost, unit_cost, profit, tax, price_per_unit, total_price }
AiText        { id, project_id, description, commercial_text, created_at }
```

## Key Decisions
- **Monorepo** structure — clear separation of backend, worker, frontend
- **Server-side calculation** — single source of truth, no frontend drift
- **Polling for model status** (simple) — SSE as optional upgrade
- **SQLAlchemy + Alembic** — mature Python ORM, type-hinted models, reliable migrations
- **Celery + Redis** — production-grade task queue, Flower dashboard available
- **trimesh** — robust Python library for 3D mesh analysis (STL/OBJ/3MF)
- **react-three-fiber** — declarative Three.js, fits React paradigm

## Estimated Structure

```
├── docker-compose.yml
├── .env.example
├── server/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry
│   │   ├── routers/              # auth, projects, models, calc, ai
│   │   ├── dependencies/        # auth, db session
│   │   ├── services/            # calc engine, ai service
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── tasks.py             # Celery task definitions (producer)
│   │   └── config.py            # pydantic-settings
│   ├── alembic/                 # migrations
│   ├── Dockerfile
│   └── requirements.txt
├── worker/
│   ├── tasks/
│   │   ├── celery_app.py         # Celery app config
│   │   └── process_model.py     # trimesh-based 3D analysis
│   ├── Dockerfile
│   └── requirements.txt
├── client/
│   ├── src/
│   │   ├── pages/               # Login, Register, ProjectList, ProjectDetail
│   │   ├── components/          # Viewer3D, ParamsForm, CalcResult, AiPanel
│   │   ├── api/                 # axios client, auth interceptor
│   │   ├── i18n/                # en.json, ru.json
│   │   └── store/               # zustand or context
│   ├── Dockerfile
│   └── package.json
└── README.md
```
