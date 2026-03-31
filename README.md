# The LHP Network

Mạng lưới cựu học sinh Trường THPT chuyên Lê Hồng Phong — Alumni network for Le Hong Phong High School.

## Tech Stack

- **React 18** + TypeScript + Vite
- **Tailwind CSS v4** — dark theme
- **react-globe.gl** — interactive 3D globe with Three.js
- **Supabase** — PostgreSQL database + REST API
- **Cloudinary** — image upload and CDN with on-the-fly transforms
- **OpenStreetMap Nominatim** — geocoding for city names

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset name |

### 3. Set up Supabase

Create a `posts` table with the following schema:

```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  school_year TEXT NOT NULL,
  city TEXT,
  country TEXT,
  caption TEXT,
  image_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Anyone can insert posts"
  ON posts FOR INSERT WITH CHECK (true);
```

### 4. Run the dev server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

Set the environment variables in the Vercel dashboard under Settings > Environment Variables.

## Features

- **Interactive 3D Globe** — visualizes alumni locations worldwide with animated arcs from Ho Chi Minh City
- **Alumni Directory** — filterable by class, school year, and city with paginated card grid
- **Join Form** — submit your info with photo upload, auto-geocoding of city names
- **Responsive Design** — works on desktop and mobile
- **Dark Theme** — matches the original LHP Network aesthetic

## Project Structure

```
src/
├── components/
│   ├── AlumniCard.tsx    — individual alumni card
│   ├── FilterBar.tsx     — class/year/city filter dropdowns
│   ├── Footer.tsx        — site footer
│   ├── Globe3D.tsx       — interactive 3D globe
│   ├── Header.tsx        — sticky header with navigation
│   ├── JoinForm.tsx      — submission form
│   ├── ListView.tsx      — main list view with grid
│   └── Pagination.tsx    — page navigation
├── lib/
│   ├── cloudinary.ts     — image upload + URL transforms
│   └── supabase.ts       — Supabase client
├── types/
│   └── index.ts          — TypeScript interfaces
├── App.tsx               — root component with view routing
├── main.tsx              — entry point
└── index.css             — Tailwind + global styles
```
