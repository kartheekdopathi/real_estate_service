# 🚀 Deployment Progress Tracker

**Project:** Real Estate Service  
**Repository:** [kartheekdopathi/real_estate_service](https://github.com/kartheekdopathi/real_estate_service)  
**Last Updated:** April 2, 2026

---

## ✅ COMPLETED STEPS

### Phase 1: Project Documentation
- [x] Created `foldure_structure.md` - Complete folder structure explanation
- [x] Created `docs/vercel-github-cicd-deployment.md` - Vercel deployment guide (all steps)
- [x] Created `docs/GCP_GITHUB_CICD_DEPLOYMENT.md` - GCP GKE deployment guide with beginner steps

### Phase 2: CI/CD Infrastructure
- [x] Created `.github/workflows/deploy-gke.yml` - GitHub Actions workflow for automated GKE deployment
- [x] Created Kubernetes manifests in `k8s/` folder:
  - [x] `namespace.yaml` - Kubernetes namespace `real-estate`
  - [x] `configmap.yaml` - App configuration (NODE_ENV, MEDIA_PROVIDER, JOB_DRIVER)
  - [x] `deployment.yaml` - 2 replica deployment with health checks
  - [x] `service.yaml` - ClusterIP service
  - [x] `ingress.yaml` - External Ingress (domain placeholder: `REPLACE_WITH_DOMAIN`)
  - [x] `secret-template.yaml` - Reference template for Kubernetes secrets

### Phase 3: Git Repository Setup
- [x] Initialized Git repository (`git init`)
- [x] Created root `.gitignore` - Ignores node_modules, .env, build artifacts
- [x] Updated `web/.gitignore` - Ignores runtime uploads (keeps only .gitkeep)
- [x] Cleaned Git staging:
  - [x] Removed root `node_modules/` from staging
  - [x] Removed nested `web/.git` folder (converted from gitlink)
  - [x] Removed tracked uploaded images
- [x] Committed code (`git commit -m "Initial commit for GKE CI/CD setup"`)
- [x] Pushed to GitHub (`git push -u origin main`)
- [x] **GitHub Actions workflow is now live and monitoring the `main` branch**

---

## 📋 NEXT STEPS (GCP & K8s Setup)

### Step 1: Create GCP Project
**Status:** ✅ Complete (March 24, 2026)  
**Action:** Create new GCP project with billing enabled
- [x] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [x] Click "Select a Project" → "New Project"
- [x] Project Name: `real-estate-service`
- [x] Create project
- [x] Enable billing
- [x] IAM Owner: `dopathikartheek@gmail.com`
- [x] Save `PROJECT_ID` → **`real-estate-service-491208`**

**All commands used in Step 1 (Project setup):**
```powershell
# Step 1 is mostly done in Google Cloud Console (UI):
# - Create project
# - Enable billing

# Optional CLI verification used later
gcloud projects list --format="table(projectId,name,lifecycleState)"
```

### Step 2: Install GCP Tools
**Status:** ✅ Complete (March 24, 2026)  
**Action:** Install required CLI tools on your machine
- [x] Install `gcloud` CLI (Google Cloud SDK 557.0.0)
- [x] Install `kubectl` (Client v1.34.1 verified)
- [x] Install `gke-gcloud-auth-plugin` (required for `kubectl` auth to GKE)
- [x] Run `gcloud auth login` to authenticate
- [x] Set active project: `gcloud config set project real-estate-service-491208`

**All commands used in Step 2 (Tooling + auth):**
```powershell
# Verify gcloud installation
gcloud --version

# Login to Google Cloud
gcloud auth login

# Set active project
gcloud config set project real-estate-service-491208

# Verify active project
gcloud config get-value project

# Install/verify kubectl
gcloud components install kubectl
kubectl version --client

# Install GKE auth plugin (required by kubectl for GKE)
gcloud components install gke-gcloud-auth-plugin
```

### Step 3: Enable Required GCP APIs
**Status:** ✅ Complete (March 24, 2026)  
**Project:** `real-estate-service-491208`  
**Required APIs:**
- [x] Kubernetes Engine API
- [x] Artifact Registry API
- [x] Cloud Build API
- [x] Cloud Resource Manager API
- [x] Service Networking API
- [x] Verified with `gcloud services list --enabled --project real-estate-service-491208`
- [x] Additional app APIs enabled: Maps Backend + Geocoding Backend (April 2, 2026)

**Why these 5 services are needed:**
- `container.googleapis.com` — Enables Google Kubernetes Engine so you can create and manage the `real-estate-gke` cluster.
- `artifactregistry.googleapis.com` — Lets GitHub Actions push Docker images to Artifact Registry before deployment.
- `cloudbuild.googleapis.com` — Supports container build workflows and related build operations used in Google Cloud.
- `cloudresourcemanager.googleapis.com` — Allows project-level resource access, IAM reads, and infrastructure management across the GCP project.
- `servicenetworking.googleapis.com` — Required for private service connectivity, commonly needed when connecting GKE workloads to managed services like Cloud SQL.

**All commands used in Step 3 (Enable + verify APIs):**
```powershell
# Enable required services
gcloud services enable `
  container.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  cloudresourcemanager.googleapis.com `
  servicenetworking.googleapis.com `
  --project real-estate-service-491208

# Verify enabled services
gcloud services list --enabled `
  --project real-estate-service-491208 `
  --filter="name:container.googleapis.com OR name:artifactregistry.googleapis.com OR name:cloudbuild.googleapis.com OR name:cloudresourcemanager.googleapis.com OR name:servicenetworking.googleapis.com" `
  --format="table(name,state)"

# Additional APIs enabled for app runtime integrations
gcloud services enable maps-backend.googleapis.com geocoding-backend.googleapis.com --project real-estate-service-491208

# Verify additional APIs
gcloud services list --enabled --project real-estate-service-491208 --filter="name:maps OR name:geocod" --format="table(name,state)"
```

### Step 4: Create GKE Autopilot Cluster
**Status:** ✅ Complete (March 24, 2026)  
**Action:** Create Kubernetes cluster
- [x] Region: `us-central1`
- [x] Cluster name: `real-estate-gke`
- [x] Why this step: GKE gives you the Kubernetes cluster where your app pods, service, and ingress will run.
- [x] Save cluster location and name (needed for GitHub Secrets)
- [x] Create the cluster:
  ```powershell
  gcloud container clusters create-auto real-estate-gke `
    --region us-central1 `
    --project real-estate-service-491208
  ```
- [x] Wait for cluster creation to finish (usually 5–15 minutes)
- [x] Connect `kubectl` to the cluster:
  ```powershell
  gcloud container clusters get-credentials real-estate-gke `
    --region us-central1 `
    --project real-estate-service-491208
  ```
- [x] Verify the cluster is reachable:
  ```powershell
  kubectl cluster-info
  kubectl get namespaces
  ```
- [x] Fixed GKE auth plugin error: `executable gke-gcloud-auth-plugin.exe not found`
- [x] Final GKE installation validation: `kubectl config current-context` shows `gke_real-estate-service-491208_us-central1_real-estate-gke`
- [x] Note: in GKE Autopilot, `kubectl get nodes` can show `No resources found` until user workloads are deployed
- [x] Note: this step starts billable GKE resources in your GCP project

**All commands used in Step 4 (GKE):**
```powershell
# 1) Create GKE Autopilot cluster
gcloud container clusters create-auto real-estate-gke `
  --region us-central1 `
  --project real-estate-service-491208

# 2) Get cluster credentials for kubectl
gcloud container clusters get-credentials real-estate-gke `
  --region us-central1 `
  --project real-estate-service-491208

# 3) (If needed) Install GKE auth plugin for kubectl
gcloud components install gke-gcloud-auth-plugin

# 4) Verify current kubectl context
kubectl config current-context

# 5) Verify control plane and core services
kubectl cluster-info

# 6) Verify Kubernetes namespaces
kubectl get namespaces

# 7) Check worker nodes (Autopilot may show no nodes before workloads)
kubectl get nodes

# 8) Confirm cluster status from gcloud
gcloud container clusters describe real-estate-gke `
  --region us-central1 `
  --project real-estate-service-491208 `
  --format="value(status)"
```

### Step 5: Create Artifact Registry Repository
**Status:** ✅ Complete (March 24, 2026)  
**Action:** Create Docker image repository
- [x] Location: `us-central1`
- [x] Repository name: `real-estate-service`
- [x] Repository format: `DOCKER`
- [x] Save location and repository name (needed for GitHub Secrets)

**All commands used in Step 5 (Artifact Registry):**
```powershell
# 1) Check if repository already exists
gcloud artifacts repositories list `
  --location us-central1 `
  --project real-estate-service-491208 `
  --format="table(name,format,location)"

# 2) Create Docker repository for app images
gcloud artifacts repositories create real-estate-service `
  --repository-format=docker `
  --location=us-central1 `
  --description="Docker images for real-estate-service GKE deployment" `
  --project real-estate-service-491208

# 3) Verify repository created successfully
gcloud artifacts repositories list `
  --location us-central1 `
  --project real-estate-service-491208 `
  --format="table(name,format,location)"

# 4) Describe repository details
gcloud artifacts repositories describe real-estate-service `
  --location=us-central1 `
  --project real-estate-service-491208

# 5) Configure Docker to authenticate with Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# 6) Full Docker image path to use in CI/CD (for reference)
# Format: LOCATION-docker.pkg.dev/PROJECT_ID/REPOSITORY/IMAGE:TAG
# Example: us-central1-docker.pkg.dev/real-estate-service-491208/real-estate-service/web:latest
```

### Step 6: Configure Workload Identity Federation (OIDC)
**Status:** ✅ Complete (March 24, 2026)  
**Action:** Set up GitHub-to-GCP authentication without service account keys
- [x] Create Workload Identity Pool → `github-pool`
- [x] Create Workload Identity Provider (GitHub OIDC) → `github-provider`
- [x] Scoped to repository: `kartheekdopathi/real_estate_service`
- [x] Create Service Account → `real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com`
- [x] Grant IAM role: `roles/container.developer` (deploy to GKE)
- [x] Grant IAM role: `roles/artifactregistry.writer` (push Docker images)
- [x] Grant IAM role: `roles/storage.objectViewer` (read GCS artifacts)
- [x] Bound Workload Identity Pool to Service Account (`roles/iam.workloadIdentityUser`)

**Saved values for GitHub Secrets:**
- `GCP_WORKLOAD_IDENTITY_PROVIDER` → `projects/110820045905/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `GCP_SERVICE_ACCOUNT_EMAIL` → `real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com`

**All commands used in Step 6 (Workload Identity Federation):**
```powershell
# 1) Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" `
  --project real-estate-service-491208 `
  --location="global" `
  --display-name="GitHub Actions Pool"

# 2) Create OIDC Provider for GitHub Actions (scoped to this repo)
gcloud iam workload-identity-pools providers create-oidc "github-provider" `
  --project real-estate-service-491208 `
  --location="global" `
  --workload-identity-pool="github-pool" `
  --display-name="GitHub Provider" `
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
  --attribute-condition="assertion.repository=='kartheekdopathi/real_estate_service'" `
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3) Create Service Account for GitHub Actions
gcloud iam service-accounts create "real-estate-sa" `
  --project real-estate-service-491208 `
  --display-name="Real Estate GitHub Actions SA"

# 4) Grant roles to Service Account
gcloud projects add-iam-policy-binding real-estate-service-491208 `
  --member="serviceAccount:real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com" `
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding real-estate-service-491208 `
  --member="serviceAccount:real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com" `
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding real-estate-service-491208 `
  --member="serviceAccount:real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com" `
  --role="roles/storage.objectViewer"

# 5) Bind Workload Identity Pool to Service Account
gcloud iam service-accounts add-iam-policy-binding `
  "real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com" `
  --project real-estate-service-491208 `
  --role="roles/iam.workloadIdentityUser" `
  --member="principalSet://iam.googleapis.com/projects/110820045905/locations/global/workloadIdentityPools/github-pool/attribute.repository/kartheekdopathi/real_estate_service"

# 6) Get provider full name (use as GCP_WORKLOAD_IDENTITY_PROVIDER secret)
gcloud iam workload-identity-pools providers describe github-provider `
  --workload-identity-pool="github-pool" `
  --location="global" `
  --project real-estate-service-491208 `
  --format="value(name)"

# 7) Verify IAM bindings for the service account
gcloud projects get-iam-policy real-estate-service-491208 `
  --flatten="bindings[].members" `
  --filter="bindings.members:real-estate-sa" `
  --format="table(bindings.role,bindings.members)"
```

### Step 7: Add GitHub Secrets
**Status:** ✅ Complete (April 2, 2026)  
**Action:** Configure GitHub repository secrets for CI/CD
- [x] Go to GitHub repo → Settings → Secrets and variables → Actions
- [x] Add all required secrets (10/10 complete)
- [x] GitHub CLI installed: `C:\Program Files\GitHub CLI\gh.exe`
- [x] All secrets verified and working

**GCP Infrastructure Secrets (7 total):**
- [x] `GCP_PROJECT_ID` = `real-estate-service-491208`
- [x] `GKE_CLUSTER` = `real-estate-gke`
- [x] `GKE_LOCATION` = `us-central1`
- [x] `GAR_LOCATION` = `us-central1`
- [x] `GAR_REPOSITORY` = `real-estate-service`
- [x] `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/110820045905/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- [x] `GCP_SERVICE_ACCOUNT_EMAIL` = `real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com`

**Application Runtime Secrets (3 total):**
- [x] `DATABASE_URL` = `mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service` ✅ PRODUCTION DB CONNECTED
- [x] `AUTH_JWT_SECRET` (Added)
- [x] `GOOGLE_MAPS_API_KEY` (Added)

**GitHub UI path to add secrets:**
1. Open https://github.com/kartheekdopathi/real_estate_service
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret name/value:
   - Name: `DATABASE_URL`, Value: `mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service`
5. Click **Add secret**

**Fast completion commands (if using GitHub CLI):**
```powershell
$GH = "C:\Program Files\GitHub CLI\gh.exe"
$REPO = "kartheekdopathi/real_estate_service"

# Required infra secrets
& $GH secret set GCP_PROJECT_ID --repo $REPO --body "real-estate-service-491208"
& $GH secret set GKE_CLUSTER --repo $REPO --body "real-estate-gke"
& $GH secret set GKE_LOCATION --repo $REPO --body "us-central1"
& $GH secret set GAR_LOCATION --repo $REPO --body "us-central1"
& $GH secret set GAR_REPOSITORY --repo $REPO --body "real-estate-service"
& $GH secret set GCP_WORKLOAD_IDENTITY_PROVIDER --repo $REPO --body "projects/110820045905/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
& $GH secret set GCP_SERVICE_ACCOUNT_EMAIL --repo $REPO --body "real-estate-sa@real-estate-service-491208.iam.gserviceaccount.com"

# Runtime secrets
& $GH secret set DATABASE_URL --repo $REPO --body "mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service"
& $GH secret set AUTH_JWT_SECRET --repo $REPO --body "<STRONG_RANDOM_SECRET>"
& $GH secret set GOOGLE_MAPS_API_KEY --repo $REPO --body "<YOUR_GOOGLE_MAPS_API_KEY>"

# Verify all secrets added
& $GH secret list --repo $REPO
```

**All commands/checks used in Step 7 verification:**
```powershell
# 1) Confirm project ID
gcloud config get-value project

# 2) Confirm GKE cluster details
gcloud container clusters describe real-estate-gke `
  --region us-central1 `
  --project real-estate-service-491208 `
  --format="value(name,location,status)"

# 3) Confirm Artifact Registry repo details
gcloud artifacts repositories describe real-estate-service `
  --location=us-central1 `
  --project real-estate-service-491208

# 4) Confirm Workload Identity provider full name
gcloud iam workload-identity-pools providers describe github-provider `
  --workload-identity-pool="github-pool" `
  --location="global" `
  --project real-estate-service-491208 `
  --format="value(name)"

# 5) Generate a JWT secret locally (copy output to AUTH_JWT_SECRET in GitHub)
[Convert]::ToBase64String((1..48 | ForEach-Object {Get-Random -Maximum 256}))
```

### Step 8: Deploy Database
**Status:** ✅ Complete (April 2, 2026)  
**Action:** Set up production MySQL database (Cloud SQL)
- [x] Enable Cloud SQL Admin API
- [x] Create Cloud SQL MySQL instance
- [x] Create app database
- [x] Create app database user
- [x] Allow network access (authorized IP updated as ISP IP changed)
- [x] Build production `DATABASE_URL`
- [x] Add `DATABASE_URL` to GitHub Repository Secrets
- [x] Verify production DB connection with Prisma
- [x] (Optional) Seed initial data

**Step-by-step production MySQL setup (Cloud SQL) — commands already executed:**

**0) Variables used (example):**
```powershell
$PROJECT_ID = "real-estate-service-491208"
$REGION = "us-central1"
$INSTANCE = "real-estate-mysql"
$DB_NAME = "real_estate_service"
$DB_USER = "appuser"
$DB_PASSWORD = "ChangeMe@123456"
```

**1) Enable Cloud SQL API**
Purpose: enables Cloud SQL service in the project.
```powershell
gcloud services enable sqladmin.googleapis.com --project $PROJECT_ID
```

**2) Create Cloud SQL MySQL instance**
Purpose: creates managed MySQL server (`db-f1-micro`) in `us-central1`.
```powershell
gcloud sql instances create $INSTANCE `
  --database-version=MYSQL_8_0 `
  --tier=db-f1-micro `
  --region=$REGION `
  --project=$PROJECT_ID
```

**3) Create app database**
Purpose: creates logical database for the app schema.
```powershell
gcloud sql databases create $DB_NAME `
  --instance=$INSTANCE `
  --project=$PROJECT_ID
```

**4) Create app DB user**
Purpose: creates database login used by application runtime.
```powershell
gcloud sql users create $DB_USER `
  --instance=$INSTANCE `
  --password=$DB_PASSWORD `
  --project=$PROJECT_ID
```

**5) Get current public IP**
Purpose: detect your machine public IP for temporary allowlist.
```powershell
(Invoke-WebRequest -UseBasicParsing "https://api.ipify.org").Content
```
Example output:
```text
59.182.2.80
```

**6) Authorize IP for testing**
Purpose: allow local machine to connect to Cloud SQL.
```powershell
gcloud sql instances patch $INSTANCE `
  --authorized-networks="59.182.2.80/32" `
  --project=$PROJECT_ID
```

If your ISP changes IP, rerun Step 5 and Step 6 with the new IP.

**7) Get Cloud SQL public IP**
Purpose: fetch host address used in `DATABASE_URL`.
```powershell
gcloud sql instances describe $INSTANCE `
  --project=$PROJECT_ID `
  --format="value(ipAddresses[0].ipAddress)"
```
Example output:
```text
34.46.1.107
```

**8) Build production `DATABASE_URL`**
Purpose: create connection string for app and GitHub Actions.
```text
mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service
```
Note: if password contains special characters (for example `@`, `#`, `%`), URL-encode it before using in connection string.

**9) Add `DATABASE_URL` to GitHub repository secret**
Purpose: make DB credentials available securely to CI/CD.
- Name: `DATABASE_URL`
- Secret value example: `mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service`

**10) Verify DB connectivity from application code**
Purpose: confirm Prisma can connect to production DB.
```powershell
cd web
$env:DATABASE_URL="mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service"
npx prisma migrate status
```
Expected result example:
- `Datasource "db": MySQL database "real_estate_service" at "34.46.1.107:3306"`
- `Database schema is up to date!`

**11) Apply Prisma schema to Cloud SQL (important when no migrations folder exists)**
Purpose: create required tables directly from `schema.prisma`.
```powershell
cd web
$env:DATABASE_URL="mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service"
npx prisma db push
```
Expected result example:
- `Your database is now in sync with your Prisma schema.`

**12) Validate application code and production build**
Purpose: confirm app tests pass and app can build against production DB.
```powershell
cd web
npm test

$env:DATABASE_URL="mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service"
npm run build
```
Expected result example:
- `Test Files 3 passed (3)` and `Tests 12 passed (12)`
- Next.js build completes and prints routes list.

**13) Open DB CLI and verify signup data**
Purpose: open MySQL prompt for Cloud SQL and confirm records are being inserted.

**A. Ensure your current IP is allowlisted (required):**
```powershell
# Check current public IP
(Invoke-WebRequest -UseBasicParsing "https://api.ipify.org").Content

# Replace NEW_IP with output above and patch allowlist
gcloud sql instances patch real-estate-mysql `
  --authorized-networks="NEW_IP/32" `
  --project=real-estate-service-491208
```

**B. Open Cloud SQL DB CLI:**
```powershell
gcloud sql connect real-estate-mysql `
  --user=appuser `
  --database=real_estate_service `
  --project=real-estate-service-491208
```
When prompted, enter DB password:
```text
ChangeMe@123456
```

**C. Verify tables + signup rows:**
```sql
SHOW TABLES;
SELECT COUNT(*) AS total_users FROM `User`;
SELECT id, name, email, createdAt FROM `User` ORDER BY createdAt DESC LIMIT 10;
```

If your signup succeeded, your email should appear in the last query.

**D. Exit DB CLI:**
```sql
exit
```

**Troubleshooting (if command exits with code 1):**
- If `gcloud sql connect` fails with network/timeout errors, rerun step A (your ISP IP changed).
- If prompted tool is missing, install MySQL client and retry.
- If login fails, verify username/password (`appuser` / your real DB password).

**14) Work in both Local and Production modes (recommended workflow)**
Purpose: run the same app reliably in local development and in production.

**Mode A — Local development with local XAMPP MySQL**
Use this for day-to-day coding.

1. Start **MySQL** in XAMPP Control Panel.
2. Set local DB URL in `web/.env` (or `web/.env.local`):
```dotenv
DATABASE_URL="mysql://root:@127.0.0.1:3306/real_estate_service"
```
3. Apply schema locally:
```powershell
cd web
npx prisma db push
```
4. Start app:
```powershell
cd web
npm run dev
```

**Mode B — Local app using Production Cloud SQL (for production-like testing)**
Use this when you want to test exactly against production data.

1. Ensure current public IP is allowlisted:
```powershell
$MY_IP = (Invoke-WebRequest -UseBasicParsing "https://api.ipify.org").Content
gcloud sql instances patch real-estate-mysql `
  --authorized-networks="$MY_IP/32,35.222.195.255/32" `
  --project=real-estate-service-491208 `
  --quiet
```
2. Run app with production DB URL for current terminal only:
```powershell
cd web
$env:DATABASE_URL="mysql://appuser:ChangeMe%40123456@34.46.1.107:3306/real_estate_service"
npm run dev
```

**Mode C — Production deployment (GKE)**
- Keep DB only in GitHub Secret `DATABASE_URL`.
- Do not commit real DB URL into any repo file.
- CI/CD reads secrets from GitHub Actions and deploys to GKE.

**Quick mode switch tips:**
- Local DB mode: close terminal, start new terminal, run `npm run dev` normally.
- Cloud SQL mode: set `$env:DATABASE_URL=...` in that terminal, then run `npm run dev`.
- If you get `pool timeout`, check Cloud SQL authorized networks again (IP may have changed).

**Optional seed:**
```powershell
cd web
$env:DATABASE_URL="mysql://appuser:ChangeMe@123456@34.46.1.107:3306/real_estate_service"
npm run db:seed
```

**Security note (important):**
- Keep real `DATABASE_URL` only in GitHub Secrets / secure env, never in committed files.
- After deployment stabilizes, remove local public IP authorization and move to private connectivity.

### Step 9: Configure Domain & TLS
**Status:** ⏳ Pending  
**Action:** Set up domain and SSL certificate
- [ ] Purchase/configure domain
- [ ] Update `k8s/ingress.yaml` - Replace `REPLACE_WITH_DOMAIN` with your domain
- [ ] Push to GitHub to trigger workflow
- [ ] Set up Google-managed certificate or Cert Manager

### Step 10: First Deployment
**Status:** ⏳ Pending  
**Action:** Trigger automatic deployment
- [ ] Make a code change and push to `main` branch
- [ ] GitHub Actions workflow runs automatically
- [ ] Verify deployment in GKE:
  ```bash
  kubectl get pods -n real-estate
  kubectl get svc -n real-estate
  kubectl get ingress -n real-estate
  ```
- [ ] Access application via domain

---

## 📊 Summary

| Component | Status | File/Link |
|-----------|--------|-----------|
| Documentation | ✅ Complete | `docs/`, `foldure_structure.md` |
| GitHub Actions Workflow | ✅ Live | `.github/workflows/deploy-gke.yml` |
| Kubernetes Manifests | ✅ Ready | `k8s/` folder |
| Git Repository | ✅ Pushed | [GitHub Repo](https://github.com/kartheekdopathi/real_estate_service) |
| GCP Project | ✅ Complete | Step 1 |
| GCP APIs | ✅ Complete | Step 3 |
| GKE Cluster | ✅ Complete | Step 4 |
| Artifact Registry | ✅ Complete | Step 5 |
| GitHub Secrets | ✅ Complete (10/10) | Step 7 |
| Database | ✅ Complete | Step 8 |
| First Deployment | ⏳ Pending | Step 10 |

---

## 📚 Documentation References

1. **Project Structure:** [foldure_structure.md](foldure_structure.md)
2. **Vercel Deployment:** [docs/vercel-github-cicd-deployment.md](docs/vercel-github-cicd-deployment.md)
3. **GCP GKE Deployment:** [docs/GCP_GITHUB_CICD_DEPLOYMENT.md](docs/GCP_GITHUB_CICD_DEPLOYMENT.md) ← **Follow this for Steps 1-10**

---

## 🔗 Quick Links

- **GitHub Repository:** https://github.com/kartheekdopathi/real_estate_service
- **Google Cloud Console:** https://console.cloud.google.com/
- **Kubernetes Dashboard:** `kubectl proxy` then visit http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

---

## 💡 Notes

- **Staging & Deployment:** All application code is in `web/` folder
- **API Routes:** Backend endpoints in `web/src/app/api/`
- **Frontend Pages:** UI in `web/src/app/` and `web/src/components/`
- **Database:** Prisma ORM with MariaDB; schema in `web/prisma/schema.prisma`
- **Docker:** Multi-stage Dockerfile in `web/Dockerfile`
- **Workflow Trigger:** GitHub Actions runs on every push to `main` branch

---

**To resume deployment:** Continue from **Step 1** in [docs/GCP_GITHUB_CICD_DEPLOYMENT.md](docs/GCP_GITHUB_CICD_DEPLOYMENT.md)
