# Vercel Deployment Guide with GitHub CI/CD

This guide explains exactly how to deploy this application to **Vercel** using **GitHub** for source control and automatic deployment.

---

## 1. Deployment Goal

You want this flow:

1. Keep source code in GitHub
2. Connect GitHub repository to Vercel
3. Push code to GitHub
4. Let Vercel automatically build and deploy
5. Use pull requests for preview deployments
6. Use GitHub Actions to run checks before merging

---

## 2. Important Project Reality

This project is a **single Next.js application** inside the `web/` folder.

- Frontend pages are in `web/src/app`
- Shared UI components are in `web/src/components`
- Backend API routes are in `web/src/app/api`
- Database schema is in `web/prisma`

So in Vercel:

- **Root project directory must be `web`**
- Vercel will host both the frontend and backend together

---

## 3. Before You Deploy

You must understand these two important things:

### 3.1 Database
Your app currently uses Prisma with **MySQL/MariaDB**.

Local XAMPP database will **not** work on Vercel.

You need a cloud database such as:

- Railway MySQL
- PlanetScale
- Aiven MySQL
- Google Cloud SQL for MySQL
- Any public MySQL/MariaDB server

You will need a production `DATABASE_URL`.

Example:

```env
DATABASE_URL=mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME
```

### 3.2 File Uploads
Your app currently stores uploads locally in:

- `web/public/uploads`

That is **not suitable for Vercel production**, because Vercel filesystem is temporary.

That means:

- uploaded files may disappear
- files are not shared between server instances
- local uploads are not reliable in production

For production, later move uploads to:

- Cloudinary
- AWS S3
- Google Cloud Storage
- MinIO

You can still deploy now, but local upload storage is the main limitation.

---

## 4. Required Environment Variables

From the current app, these are the main environment variables you will likely need in Vercel:

```env
DATABASE_URL=
AUTH_JWT_SECRET=
NODE_ENV=production
GOOGLE_MAPS_API_KEY=
MEDIA_PROVIDER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
VIDEO_PROVIDER=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_DEFAULT_PRIVACY=
```

Minimum required for your current app:

```env
DATABASE_URL=your-production-db-url
AUTH_JWT_SECRET=your-strong-random-secret
NODE_ENV=production
```

Also set these if you use them:

- `GOOGLE_MAPS_API_KEY`
- media provider variables
- YouTube variables

---

## 5. Step-by-Step Vercel Deployment

## Step 1: Prepare the code locally

Open terminal in the project and run:

```bash
cd web
npm install
npm run lint
npm run typecheck
npm run build
```

If `npm run build` fails, do not deploy until the build is fixed.

---

## Step 2: Create a production database

Create a hosted MySQL or MariaDB database.

After creating it, copy the connection string.

Example:

```env
DATABASE_URL=mysql://user:password@host:3306/real_estate_service
```

Then test schema sync from your machine:

```bash
cd web
npx prisma generate
npx prisma db push
```

If you already use migrations in future, use:

```bash
npx prisma migrate deploy
```

For now, based on your project, `prisma db push` is acceptable for first setup.

---

## Step 3: Push the project to GitHub

If your project is not in GitHub yet:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

If it is already in GitHub, just push your latest code:

```bash
git add .
git commit -m "Prepare project for Vercel deployment"
git push origin main
```

---

## Step 4: Import the repository into Vercel

1. Sign in to Vercel
2. Click **Add New Project**
3. Select your GitHub repository
4. Click **Import**

During project setup, configure:

- **Framework Preset**: Next.js
- **Root Directory**: `web`
- **Install Command**: `npm install`
- **Build Command**: `npx prisma generate ; npm run build`
- **Output Directory**: leave empty

Why this build command?

Because Prisma client must be generated during Vercel build.

---

## Step 5: Add environment variables in Vercel

In Vercel project settings:

1. Open **Project Settings**
2. Open **Environment Variables**
3. Add all required variables

At minimum, add:

```env
DATABASE_URL=your-production-db-url
AUTH_JWT_SECRET=your-strong-secret
NODE_ENV=production
```

Also add if needed:

```env
GOOGLE_MAPS_API_KEY=your-google-key
MEDIA_PROVIDER=local-or-cloudinary-or-minio
```

Important:

- Never commit real secrets to GitHub
- Keep `.env` only for local development
- Put production secrets in Vercel dashboard

---

## Step 6: Trigger the first deployment

Once the repo is connected and env vars are set:

1. Click **Deploy** in Vercel
2. Wait for build to finish
3. Open the generated Vercel URL

Test these pages first:

- `/`
- `/properties`
- `/login`
- `/signup`
- `/api/auth/me`

If login depends on database records, seed your database first.

---

## Step 7: Seed the production database if needed

If the app requires roles, menus, property types, admin user, or seed data, run:

```bash
cd web
npx prisma generate
node prisma/seed.mjs
```

If the seed should run against production DB, make sure your terminal uses the production `DATABASE_URL`.

For Windows PowerShell session example:

```powershell
$env:DATABASE_URL="your-production-db-url"
node prisma/seed.mjs
```

You may also need to create the first admin user using your scripts in `web/scripts/`.

---

## 6. GitHub + Vercel CI/CD Flow

Once connected, Vercel gives you automatic deployment CI/CD.

### How it works

- Push to `main` branch → Vercel production deployment
- Push a feature branch / open pull request → Vercel preview deployment
- Merge pull request → Vercel deploys latest production version

This means you do **not** need to manually upload files to Vercel every time.

---

## 7. Recommended Git Workflow

Use this workflow:

### For new feature work

```bash
git checkout -b feature/property-search-improvement
```

Make code changes, then:

```bash
git add .
git commit -m "Improve property search"
git push origin feature/property-search-improvement
```

Then:

1. Open a Pull Request in GitHub
2. GitHub Actions runs checks
3. Vercel creates a preview deployment
4. Review the preview URL
5. Merge to `main`
6. Vercel auto-deploys production

---

## 8. Add GitHub Actions for Quality Checks

Vercel handles deployment, but GitHub Actions should handle code quality checks.

Recommended checks:

- install dependencies
- generate Prisma client
- run lint
- run typecheck
- run build

Suggested workflow file location:

- `.github/workflows/ci.yml`

Example workflow:

```yaml
name: CI

on:
  push:
    branches:
      - main
      - develop
      - "feature/**"
  pull_request:

jobs:
  test-and-build:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: web

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run lint
        run: npm run lint

      - name: Run typecheck
        run: npm run typecheck

      - name: Build application
        run: npm run build
```

This workflow ensures bad code does not get merged easily.

---

## 9. Branch Protection in GitHub

Recommended GitHub settings:

1. Open GitHub repository
2. Go to **Settings**
3. Go to **Branches**
4. Add branch protection rule for `main`

Enable:

- Require a pull request before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging

Choose your CI workflow check as a required status check.

This gives you a cleaner CI/CD process.

---

## 10. Production Checklist Before Going Live

Use this checklist before using the app in production:

### Application
- [ ] `npm run build` works locally in `web`
- [ ] Vercel root directory is `web`
- [ ] Prisma client generates correctly
- [ ] All required environment variables are set in Vercel

### Database
- [ ] Production DB is public and reachable from Vercel
- [ ] `DATABASE_URL` is correct
- [ ] Prisma schema is pushed
- [ ] Seed data is inserted
- [ ] Admin user exists

### Security
- [ ] Strong `AUTH_JWT_SECRET` is set
- [ ] No secrets committed to GitHub
- [ ] Production URLs are correct

### Features
- [ ] Login works
- [ ] Signup works
- [ ] Properties page loads
- [ ] Admin pages load
- [ ] Agent pages load
- [ ] Google geocoding works if used

### Media
- [ ] You understand local uploads are not reliable on Vercel
- [ ] Plan to move uploads to cloud storage

---

## 11. Known Limitation for This Project on Vercel

The biggest limitation is this:

- `web/public/uploads/` local storage is not production-safe on Vercel

So your immediate best strategy is:

### Phase 1
- Deploy app to Vercel
- Use hosted MySQL database
- Verify frontend, login, property listing, admin panel

### Phase 2
- Move uploads to Cloudinary / S3 / GCS / MinIO
- Update media upload logic
- Redeploy

### Phase 3
- Later move to GCP if you want full infra control

---

## 12. Recommended Deployment Order for You

For your exact project, do this in order:

1. Push code to GitHub
2. Create hosted MySQL/MariaDB
3. Configure `DATABASE_URL`
4. Test `npx prisma db push`
5. Import repo into Vercel
6. Set Vercel root directory to `web`
7. Add env vars in Vercel
8. Set build command to `npx prisma generate ; npm run build`
9. Deploy
10. Test login, properties, filters, admin pages
11. Add GitHub Actions workflow
12. Enable branch protection
13. Replace local upload storage with cloud storage

---

## 13. Quick Command Summary

### Local verification

```bash
cd web
npm install
npm run lint
npm run typecheck
npm run build
```

### Prisma

```bash
cd web
npx prisma generate
npx prisma db push
```

### GitHub push

```bash
git add .
git commit -m "Prepare Vercel deployment"
git push origin main
```

---

## 14. What Vercel Will Handle Automatically

After setup, Vercel will automatically handle:

- pulling latest code from GitHub
- installing dependencies
- building the Next.js app
- deploying the frontend
- deploying API routes
- preview URLs for pull requests
- production deployment when `main` updates

---

## 15. Final Recommendation

Yes, this app is deployable to Vercel.

Best production approach for your current project:

- Host app on Vercel
- Use remote MySQL/MariaDB
- Keep `web` as root directory
- Use GitHub integration for deployment
- Add GitHub Actions for lint/typecheck/build checks
- Migrate uploads to cloud storage after initial deployment

---

## 16. Next Practical Step

After reading this document, your next best action is:

1. Create the GitHub repository
2. Create a hosted MySQL database
3. Import the repo into Vercel
4. Add environment variables
5. Deploy the first build

If you want, the next document can be:

- a **GitHub Actions CI file setup guide**, or
- a **Vercel environment variables checklist**, or
- a **cloud media storage migration guide**
