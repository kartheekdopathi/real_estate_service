# GCP + GitHub CI/CD Deployment Guide (Real Estate Service)

## ✅ Primary Guide: GitHub Actions → GKE (Kubernetes)

This section is the current deployment path for this repository.

It deploys your app using:
- GitHub Actions workflow: `.github/workflows/deploy-gke.yml`
- Docker image in Artifact Registry
- Kubernetes manifests in `k8s/`
- Runtime on Google Kubernetes Engine (GKE)

Repository layout used by this guide:
- workspace root: `real_estate_service`
- Next.js app: `web/`
- workflow: `.github/workflows/deploy-gke.yml`
- manifests: `k8s/*.yaml`

---

## 🚀 Beginner Start Here (Do this now)

If you are new, do only this section first.

### Step 0 (Must do first): Push code to GitHub

Yes — you must push code to GitHub before GitHub CI/CD can deploy.

Why:
- The workflow file `.github/workflows/deploy-gke.yml` runs inside GitHub Actions.
- No repository code in GitHub = no pipeline run.

What to do now:
1. Create an empty GitHub repository (do not add README/license from GitHub UI)
2. Open terminal in project root: `real_estate_service`
3. Run these commands:

```bash
git init
git add .
git commit -m "Initial commit for GKE deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

If repository already exists locally, use:

```bash
git add .
git commit -m "Prepare GKE CI/CD"
git push origin main
```

Done when:
- You can open your GitHub repo and see all project files
- `.github/workflows/deploy-gke.yml` is visible in GitHub

---

### Step 0.1: `.gitignore` check (very important)

Before pushing, confirm sensitive/local/generated files are ignored.

Why:
- Prevent leaking secrets
- Keep repo clean and small

Must NOT be committed:
- `.env`
- `node_modules/`
- `.next/`
- `coverage/`
- `*.log`
- local upload/runtime temp files

What to check:
1. Open `web/.gitignore`
2. Ensure it contains at least these patterns:

```gitignore
.env
.env.local
node_modules/
.next/
coverage/
*.log
```

3. If any sensitive file is already tracked, untrack it:

```bash
git rm --cached web/.env
git commit -m "Stop tracking local env file"
git push
```

Done when:
- `git status` shows no `.env` or `node_modules` tracked

---

### Step 1 (Right now): Create your GCP project and enable billing

Why:
- GKE, Artifact Registry, and IAM cannot be created without billing enabled.

What to do:
1. Open Google Cloud Console
2. Create a new project (or choose existing)
3. Attach billing account to that project
4. Note your `PROJECT_ID` (you will use this everywhere)

Done when:
- You can see your project in the top project selector
- Billing shows as **enabled**

---

### Step 2: Install tools on your local machine

Why:
- You need `gcloud` and `kubectl` to verify cluster and deployment.

What to install:
- Google Cloud CLI (`gcloud`)
- Kubernetes CLI (`kubectl`)

Verify:

```bash
gcloud version
kubectl version --client
```

Done when:
- Both commands print versions without error

---

### Step 3: Enable required APIs in GCP

Why:
- GitHub Actions deploy needs these services active.

Enable these APIs:
- Kubernetes Engine API
- Artifact Registry API
- IAM API
- IAM Credentials API
- Security Token Service API

Done when:
- All APIs show as **Enabled** in GCP console

---

### Step 4: Create GKE cluster (Autopilot recommended)

Why:
- This is where your app containers will run.

What to do:
1. GCP Console → Kubernetes Engine → Clusters
2. Create cluster
3. Choose **Autopilot** (simpler for beginners)
4. Pick region close to users (example `asia-south1`)
5. Save cluster name (example `real-estate-gke`)

Done when:
- Cluster status is **Running**

---

### Step 5: Create Artifact Registry Docker repository

Why:
- GitHub Actions will push your Docker image here before deploying to GKE.

What to do:
1. GCP Console → Artifact Registry → Repositories
2. Create repository
3. Format: **Docker**
4. Name: `real-estate-images` (or your chosen name)
5. Region: same as cluster region

Done when:
- Repository appears in Artifact Registry list

---

### Step 6: Configure GitHub secrets

Why:
- Workflow `.github/workflows/deploy-gke.yml` reads values from GitHub Secrets.

In GitHub repo → Settings → Secrets and variables → Actions, create:

GCP secrets:
- `GCP_PROJECT_ID`
- `GKE_CLUSTER`
- `GKE_LOCATION`
- `GAR_LOCATION`
- `GAR_REPOSITORY`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`

App secrets:
- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `GOOGLE_MAPS_API_KEY` (if used)

Done when:
- All secrets are visible in GitHub Actions secrets list

---

### Step 7: One required file edit before first deploy

Edit `k8s/ingress.yaml` and replace:
- `REPLACE_WITH_DOMAIN` → your real domain (or temporary host you plan to use)

If domain is not ready now:
- keep placeholder for first dry run
- later update host and re-deploy

Done when:
- File is committed to GitHub

---

### Step 8: Trigger first deployment

Why:
- Deployment starts automatically on push to `main`.

What to do:
1. Commit your latest changes
2. Push to `main`
3. Open GitHub → Actions → `CI-CD GKE`
4. Watch all steps succeed

Done when:
- Workflow status is **green/success**

---

### Step 9: Verify deployment in GKE

Run:

```bash
kubectl get pods -n real-estate
kubectl get svc -n real-estate
kubectl get ingress -n real-estate
```

Done when:
- Pods are Running
- Service exists
- Ingress has external address/IP

---

### Step 10: Open your app URL

Use:
- your configured domain, or
- ingress IP/domain mapped in DNS

Basic checks:
- Home page opens
- Login works
- Properties page loads

---

## Beginner milestone checklist

- [ ] Code pushed to GitHub (`main` branch)
- [ ] `.gitignore` verified for secrets/build files
- [ ] GCP project + billing ready
- [ ] Tools installed (`gcloud`, `kubectl`)
- [ ] APIs enabled
- [ ] GKE cluster running
- [ ] Artifact Registry repo created
- [ ] GitHub secrets added
- [ ] Ingress host configured
- [ ] First workflow run successful
- [ ] App URL reachable

---

## Beginner Q&A log (your key questions)

### Q1) "Can I deploy this application on Vercel?"
Answer: Yes. It is deployable on Vercel because it is a Next.js app. But for production you need a hosted database and should avoid local file uploads.

### Q2) "How can I find frontend and backend in this project?"
Answer:
- Frontend: `web/src/app`, `web/src/components`
- Backend: `web/src/app/api`, `web/src/lib`, `web/prisma`

### Q3) "First I want Vercel, then GCP."
Answer: Good plan. Start on Vercel for quick deployment, then move to GKE for full infrastructure control.

### Q4) "Before this, do I need to push code to GitHub?"
Answer: Yes, absolutely. GitHub Actions CI/CD starts only after code exists in GitHub.

### Q5) "What should I do right now as a beginner?"
Answer:
1. Push code to GitHub (Step 0)
2. Verify `.gitignore` (Step 0.1)
3. Start GCP setup (Step 1 onward)

---

## 1) Architecture (GKE)

- **GitHub**: source + CI/CD trigger (`push` to `main`)
- **GitHub Actions**: lint, typecheck, build, docker build/push, deploy
- **Artifact Registry**: stores built app images
- **GKE**: runs your app as Deployment + Service + Ingress
- **GitHub Secrets**: stores GCP + app secrets

---

## 2) Files already in this repo

- `.github/workflows/deploy-gke.yml`
- `k8s/namespace.yaml`
- `k8s/configmap.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `k8s/secret-template.yaml` (reference only; CI creates real secret from GitHub Secrets)

---

## 3) One-time GCP setup

Replace placeholders with your values:
- `PROJECT_ID`
- `REGION` (example: `asia-south1`)
- `GAR_REPOSITORY` (example: `real-estate-images`)
- `GKE_CLUSTER`
- `GKE_LOCATION` (zone or region of your cluster)

### 3.1 Enable required APIs

- Kubernetes Engine API
- Artifact Registry API
- IAM API
- IAM Credentials API
- Security Token Service API

### 3.2 Create Artifact Registry Docker repository

Create Docker repository in the same region as your deployment strategy.

Example:
- Region: `asia-south1`
- Repo: `real-estate-images`

### 3.3 Create GKE cluster

Create either:
- **Autopilot** cluster (recommended to start quickly), or
- Standard cluster

### 3.4 Create deploy service account

Create a service account for GitHub Actions deploys, for example:
- `github-gke-deployer@PROJECT_ID.iam.gserviceaccount.com`

Grant minimum practical roles:
- `roles/artifactregistry.writer`
- `roles/container.developer`
- `roles/container.clusterViewer`

If you use custom restrictions, also ensure permission to fetch cluster credentials and deploy resources.

---

## 4) Configure Workload Identity Federation (GitHub OIDC)

Use OIDC (recommended) instead of service-account JSON keys.

Create:
- Workload Identity Pool
- OIDC Provider for GitHub
- IAM binding allowing this repository to impersonate deploy service account

You will store these in GitHub Secrets:
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`

---

## 5) Add GitHub repository secrets

In GitHub repo: **Settings → Secrets and variables → Actions**

Add GCP/infra secrets:
- `GCP_PROJECT_ID`
- `GKE_CLUSTER`
- `GKE_LOCATION`
- `GAR_LOCATION` (example: `asia-south1`)
- `GAR_REPOSITORY`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`

Add app runtime secrets:
- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `GOOGLE_MAPS_API_KEY` (if used)

Notes:
- Workflow creates/updates Kubernetes secret `real-estate-secrets` from these values.
- Do not commit real secrets in files.

---

## 6) Configure Kubernetes manifests

### 6.1 Set production domain host

Edit `k8s/ingress.yaml`:
- Replace `REPLACE_WITH_DOMAIN` with your real domain.

If no domain yet, keep placeholder temporarily and test with Ingress IP after update.

### 6.2 Runtime env defaults

Edit `k8s/configmap.yaml` if needed:
- `MEDIA_PROVIDER`
- `JOB_DRIVER`
- other non-secret defaults

---

## 7) Deploy flow (automatic)

When you push to `main`, `.github/workflows/deploy-gke.yml` runs:

1. Install dependencies in `web/`
2. Run `lint`
3. Run `typecheck`
4. Run `build`
5. Authenticate to GCP (OIDC)
6. Docker build + push to Artifact Registry
7. Get GKE credentials
8. Create/update Kubernetes secret from GitHub Secrets
9. Apply namespace/config/deployment/service/ingress
10. Wait for rollout success

---

## 8) First deployment checklist

- [ ] GKE cluster is running
- [ ] Artifact Registry repo exists
- [ ] All GitHub Secrets added
- [ ] `k8s/ingress.yaml` host is set
- [ ] Push to `main` completed
- [ ] GitHub Actions job succeeded
- [ ] `kubectl get pods -n real-estate` shows healthy pods
- [ ] `kubectl get ingress -n real-estate` has external address

---

## 9) Useful verification commands

Run from your local shell (after auth to GCP + cluster):

```bash
kubectl get ns
kubectl get deploy -n real-estate
kubectl get pods -n real-estate
kubectl get svc -n real-estate
kubectl get ingress -n real-estate
kubectl logs deploy/real-estate-web -n real-estate --tail=200
```

---

## 10) Production notes for this app

1. **Database**
  - Use managed MySQL/MariaDB (Cloud SQL recommended)
  - Ensure `DATABASE_URL` is reachable from GKE

2. **Uploads**
  - Current `MEDIA_PROVIDER=local` is not ideal for multi-pod production
  - Prefer Cloudinary / GCS / S3 / MinIO for durable storage

3. **Scaling**
  - Adjust replicas/resources in `k8s/deployment.yaml`

4. **TLS**
  - Add managed certificate and DNS mapping for production HTTPS

---

## 11) Troubleshooting quick map

- Build fails in workflow → check `web/package-lock.json`, lint/typecheck/build logs
- Docker push denied → verify Artifact Registry permissions and region/repo values
- GKE auth fails → verify `GCP_WORKLOAD_IDENTITY_PROVIDER` and SA IAM binding
- Pod crash loop → check `kubectl logs` and missing env/secret values
- Ingress no external IP → wait few minutes, then check ingress events and class annotations

---

## Legacy section below

The remaining sections in this document describe an older **Cloud Run + Cloud Build** path. Keep them for reference only if you still need Cloud Run.

---

## 1) Target Architecture

- **GitHub** (source control)
- **Cloud Build Trigger** (runs on push to branch)
- **Artifact Registry** (stores container image)
- **Cloud Run** (runs Next.js app)
- **Secret Manager** (stores runtime secrets)
- **Cloud SQL MariaDB** (optional, if your DB is on GCP)

---

## 2) Prerequisites

1. Google Cloud project (billing enabled)
2. GitHub repository (this code pushed)
3. GCP CLI installed locally (optional but recommended)
4. Domain ready (optional; can use default Cloud Run URL)

---

## 3) Required Environment Variables for This App

From app code (`web/src/lib/env.ts`), minimum runtime envs are:
- `DATABASE_URL` (required)
- `AUTH_JWT_SECRET` (recommended/required for auth behavior)

Commonly used optional envs:
- `PROPERTY_URL_SECRET`
- `MEDIA_PROVIDER` (`local` / `cloudinary` / `minio`)
- `JOB_DRIVER` (`inmemory` / `redis`)
- `REDIS_URL` (if using redis)
- Cloudinary/MinIO keys if media provider uses them

---

## 4) One-Time GCP Setup

Replace placeholders:
- `PROJECT_ID`
- `REGION` (example: `asia-south1`)
- `REPO_NAME` (example: `real-estate-images`)
- `SERVICE_NAME` (example: `real-estate-web`)

### 4.1 Enable APIs

Enable:
- Cloud Build API
- Cloud Run Admin API
- Artifact Registry API
- Secret Manager API
- IAM API
- (Optional) Cloud SQL Admin API

### 4.2 Create Artifact Registry Docker repo

Create a Docker repo in your region (example name: `real-estate-images`).

### 4.3 Create runtime service account for Cloud Run

Create service account, e.g.:
- `cloud-run-runtime@PROJECT_ID.iam.gserviceaccount.com`

Grant least required roles:
- `roles/secretmanager.secretAccessor`
- `roles/cloudsql.client` (only if using Cloud SQL)
- Any storage/media roles if needed

### 4.4 Create secrets in Secret Manager

Create secrets such as:
- `DATABASE_URL`
- `AUTH_JWT_SECRET`
- `PROPERTY_URL_SECRET`
- media credentials (if used)

Use latest versions for deployment references.

---

## 5) Add Dockerfile for Next.js app (inside `web/`)

Create file: `web/Dockerfile`

Use a production multi-stage image for Next.js 16. Example:

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080
CMD ["npm", "run", "start", "--", "-p", "8080"]
```

Notes:
- This app runs from `web/` directory.
- Cloud Run expects container to listen on port `8080`.

---

## 6) Add Cloud Build config in repo root

Create file: `cloudbuild.yaml` at repository root (`real_estate_service/cloudbuild.yaml`):

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-f'
      - 'web/Dockerfile'
      - '-t'
      - '${_AR_HOST}/${PROJECT_ID}/${_AR_REPO}/${_SERVICE_NAME}:${SHORT_SHA}'
      - './web'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '${_AR_HOST}/${PROJECT_ID}/${_AR_REPO}/${_SERVICE_NAME}:${SHORT_SHA}'

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - '${_SERVICE_NAME}'
      - '--image=${_AR_HOST}/${PROJECT_ID}/${_AR_REPO}/${_SERVICE_NAME}:${SHORT_SHA}'
      - '--region=${_REGION}'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--service-account=${_RUNTIME_SA}'
      - '--set-env-vars=NODE_ENV=production,MEDIA_PROVIDER=local,JOB_DRIVER=inmemory'
      - '--set-secrets=DATABASE_URL=DATABASE_URL:latest,AUTH_JWT_SECRET=AUTH_JWT_SECRET:latest,PROPERTY_URL_SECRET=PROPERTY_URL_SECRET:latest'

substitutions:
  _REGION: 'asia-south1'
  _AR_HOST: 'asia-south1-docker.pkg.dev'
  _AR_REPO: 'real-estate-images'
  _SERVICE_NAME: 'real-estate-web'
  _RUNTIME_SA: 'cloud-run-runtime@PROJECT_ID.iam.gserviceaccount.com'

options:
  logging: CLOUD_LOGGING_ONLY
```

### 6.1) Files status in this repository

These deployment files are already created:
- `web/Dockerfile`
- `cloudbuild.yaml`

Before first deployment, update placeholders in `cloudbuild.yaml`:
- `_RUNTIME_SA` → replace `REPLACE_WITH_PROJECT_ID`
- `_REGION` if needed
- `_AR_HOST` if region changes
- `_AR_REPO` if your Artifact Registry repo name differs
- `_SERVICE_NAME` if you want a different Cloud Run service name

---

## 6.2) Exact “Create Steps” (Console path + action)

Use this sequence exactly once per project.

### Step A — Create Artifact Registry repo
1. GCP Console → **Artifact Registry** → **Repositories**
2. Click **Create Repository**
3. Name: `real-estate-images`
4. Format: **Docker**
5. Region: same as Cloud Run (example `asia-south1`)
6. Click **Create**

### Step B — Create runtime service account
1. GCP Console → **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `cloud-run-runtime`
4. Create and continue
5. Grant roles:
  - `Secret Manager Secret Accessor`
  - `Cloud SQL Client` (only if Cloud SQL used)
6. Done

### Step C — Create secrets
1. GCP Console → **Security** → **Secret Manager**
2. Click **Create Secret** for each key:
  - `DATABASE_URL`
  - `AUTH_JWT_SECRET`
  - `PROPERTY_URL_SECRET`
3. Paste values and create

### Step D — Grant Cloud Build permissions
1. Get Cloud Build SA: `PROJECT_NUMBER@cloudbuild.gserviceaccount.com`
2. GCP Console → **IAM** → grant:
  - `Cloud Run Admin`
  - `Artifact Registry Writer`
  - `Service Account User` (on runtime service account)

### Step E — Connect GitHub trigger
1. GCP Console → **Cloud Build** → **Triggers**
2. Click **Create Trigger**
3. Source: **GitHub**
4. Connect repo
5. Event: push to branch (`main` recommended)
6. Config type: **Cloud Build configuration file**
7. File path: `cloudbuild.yaml`
8. Save

---

## 6.3) Update `cloudbuild.yaml` correctly (must-do)

Update this field format:
- `_RUNTIME_SA: cloud-run-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com`

Validate the substitution block values match your project:
- `_REGION`
- `_AR_HOST`
- `_AR_REPO`
- `_SERVICE_NAME`

If these values do not match your real resources, build/deploy will fail.

---

## 7) Connect GitHub to Cloud Build Trigger

1. In GCP Console → **Cloud Build** → **Triggers** → **Create Trigger**
2. Source: **GitHub**
3. Install/authorize Cloud Build GitHub App
4. Select repo + branch (example `main`)
5. Build config: `cloudbuild.yaml`
6. Save trigger

Now every push to branch will:
- install dependencies
- run lint + typecheck
- run unit tests + coverage threshold check
- build image
- push image
- deploy Cloud Run

---

## 8) IAM Needed for Cloud Build Service Account

Cloud Build SA format usually:
- `PROJECT_NUMBER@cloudbuild.gserviceaccount.com`

Grant roles:
- `roles/run.admin`
- `roles/iam.serviceAccountUser` on runtime SA
- `roles/artifactregistry.writer`
- `roles/secretmanager.secretAccessor` (if build step reads secrets directly)

---

## 9) Database (Cloud SQL MariaDB) Setup (Optional but Recommended)

If you host DB in GCP:

1. Create Cloud SQL MariaDB instance
2. Create database + user
3. Build `DATABASE_URL` in MariaDB format
4. Store URL in Secret Manager as `DATABASE_URL`

Example format:

```text
mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME
```

For production, prefer private networking and secure access strategy.

---

## 10) Prisma Notes (Important)

This app uses Prisma.

Recommended pipeline approach:
1. Keep schema in git
2. Run migration manually first (safe)
3. Then enable automatic deploys

Safe command from local/admin shell (inside `web/`):
- `npm run db:generate`
- `npm run db:push` (or your migration flow)

If you want full automation, create a separate Cloud Run Job for migrations before deploy.

---

## 11) First Deployment Checklist

- [ ] APIs enabled
- [ ] Artifact Registry created
- [ ] Runtime SA created + roles granted
- [ ] Secrets created
- [ ] `web/Dockerfile` added
- [ ] `cloudbuild.yaml` added
- [ ] GitHub trigger created
- [ ] Push commit to main
- [ ] Verify Cloud Build success
- [ ] Open Cloud Run URL and test login/API

### 11.1) First deployment execution (practical flow)

1. Commit these files to GitHub:
  - `web/Dockerfile`
  - `cloudbuild.yaml`
  - this guide file
2. Push commit to the trigger branch (example `main`)
3. Open Cloud Build history and wait for green status
4. Open Cloud Run service URL from build logs
5. Verify:
  - home page loads
  - login works
  - `/api/auth/me` responds correctly for authenticated user
6. If DB-related pages fail, recheck `DATABASE_URL` secret and DB network access

---

## 12) Rollback Strategy

If deployment fails after release:
1. Cloud Run → Revisions
2. Route traffic back to previous healthy revision
3. Investigate failed build/deploy logs

---

## 13) Recommended Production Hardening

- Use custom domain + managed SSL
- Set minimum instances to reduce cold starts
- Add Cloud CDN / Armor (if needed)
- Enable uptime checks + alerts
- Restrict CORS/cookies by final domain
- Rotate secrets periodically

---

## 14) Quick Troubleshooting

### Build fails at Next.js compile
- Check Cloud Build logs
- Ensure all required env vars are provided at runtime

### App starts but API auth fails
- Verify `AUTH_JWT_SECRET` is set
- Verify cookie domain/secure behavior under HTTPS

### DB connection fails
- Verify `DATABASE_URL`
- Verify DB firewall/network access
- Verify user/password and DB name

### Cloud Run deploy fails with permission errors
- Check Cloud Build SA has `Cloud Run Admin`
- Check Cloud Build SA has `Service Account User` on runtime SA
- Check runtime SA email in `_RUNTIME_SA` is exact

### Secret errors at runtime
- Secret names must match exactly:
  - `DATABASE_URL`
  - `AUTH_JWT_SECRET`
  - `PROPERTY_URL_SECRET`
- Ensure each secret has at least one enabled version (`latest` resolves)

---

## 15) What You Need To Add In Repo (Summary)

1. `web/Dockerfile`
2. `cloudbuild.yaml`
3. (Optional) migration job config

This document covers the complete step-by-step deployment flow from GitHub to GCP Cloud Run.

---

## 16) Final End-to-End Runbook (short form)

1. Enable required GCP APIs
2. Create Artifact Registry Docker repo
3. Create Cloud Run runtime SA + roles
4. Create Secret Manager secrets
5. Confirm `web/Dockerfile` exists
6. Update `cloudbuild.yaml` substitutions
7. Grant Cloud Build SA IAM roles
8. Create GitHub Cloud Build trigger
9. Push to `main`
10. Confirm Cloud Build success
11. Open Cloud Run URL and test app/API
12. Roll back to previous revision if needed
