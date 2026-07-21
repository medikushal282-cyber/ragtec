# ragtec AI Demo Project Implementation Plan

The objective is to build a modern, production-quality demo website called "ragtec AI" based on the "Time-Aware Retrieval-Augmented Generation" concept for cybersecurity threat intelligence. The demo will simulate a real enterprise SOC platform using mock data and feature advanced UI concepts (glassmorphism, Apple-level animations) using React, TypeScript, Vite, TailwindCSS, and Framer Motion.

## User Review Required

> [!IMPORTANT]
> A previous Next.js project named `temporal-rag-dashboard` exists in the workspace. Since your tech stack requests Vite and an Express backend, I will create a new separate directory named `ragtec-demo` to house both the `frontend` and `backend` code. Please let me know if you would prefer to overwrite or reuse the existing directory instead.

> [!NOTE]
> TailwindCSS requires initialization and configuration. I will set up the latest v3 or v4 (depending on Vite compatibility, standard v3 is safest for most current plugins) along with CSS variables for the requested color scheme (Black, Dark Blue, Neon Cyan, Green, Red).

## Open Questions

- Should the Express backend and Vite frontend run concurrently via a single script (e.g., using `concurrently` in the root), or would you prefer them completely decoupled as separate projects to be run in different terminals?
- Do you have a specific port requirement for the frontend or backend (e.g., frontend on 5173, backend on 3000)?
- Are there any specific logo or branding assets I should use, or is it okay to use synthetic branding using Lucide icons (e.g., Shield, Activity)?

## Proposed Changes

### Setup & Scaffolding

#### [NEW] ragtec-demo/backend
- Initialize a Node.js + Express backend project.
- Create mock data for 20 Threat Reports, 10 CVEs, 10 Threat Actors, 5 Zero Day Alerts.
- Set up REST endpoints (e.g., `/api/threats`, `/api/chat`, `/api/retrieve`) that simulate the retrieval process, calculating the `Final Score = 0.45 * Similarity + 0.30 * Recency + 0.15 * Severity + 0.10 * Source Trust`.
- Structure placeholder folders/comments for vector db (Pinecone), relational db (PostgreSQL), and LLM (OpenAI).

#### [NEW] ragtec-demo/frontend
- Initialize a Vite React TypeScript project.
- Install `tailwindcss`, `framer-motion`, `lucide-react`, `recharts`, `react-router-dom`.
- Set up dark mode global CSS (`index.css`) incorporating the requested colors (Black, Dark Blue, Neon Cyan).

### Frontend Pages & Components

#### [NEW] ragtec-demo/frontend/src/components
- Reusable UI components like `Card`, `Button`, `Badge`, `GlowEffect`, `MockDataGenerator`.

#### [NEW] ragtec-demo/frontend/src/pages
- **Landing Page**: Hero section with problem statement, CTA buttons, and an architectural comparison (Static AI vs ragtec).
- **Dashboard**: High-level metrics, Recharts graphs (Severity Distribution, Threats over Time), and Activity feed.
- **Threat Intelligence Feed**: A stylized data table of threats (glowing elements for the latest/critical).
- **AI Threat Assistant**: A simulated chat interface demonstrating grounded responses, displaying citations, evidence, and confidence metrics.
- **Time-aware Retrieval Demo (Key Feature)**: Two-column animated comparison. Left (Traditional AI - standard similarity) vs. Right (ragtec - similarity + recency + severity + trust).
- **Architecture Page**: Animated data flow diagram using Framer Motion.
- **About Project**: Text content explaining the loopholes in existing systems and ragtec benefits.

## Verification Plan

### Automated Tests
- None specified for this demo, but TypeScript strict mode will ensure type safety.
- Express routes will be verified using `curl` or browser tests.

### Manual Verification
- Start the backend server and ensure mock data is being served dynamically with random timestamps updating.
- Start the Vite dev server and review every page (Landing, Dashboard, Threat Feed, AI Assistant, Retrieval Demo, Architecture, About) to verify glassmorphism UI, Apple-level animations, responsive behavior, and correct theme application.
- Test the retrieval demo to ensure the visual reranking logic correctly demonstrates the temporal weighting formula.
