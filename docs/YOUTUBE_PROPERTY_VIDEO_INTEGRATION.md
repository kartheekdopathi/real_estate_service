# YouTube Property Video Integration Guide

This document explains whether your app can upload property videos to a YouTube application channel, store the result, and display that video back inside the application.

Short answer:

- Yes, it is possible.
- But it is not a small change.
- It needs Google / YouTube API setup, OAuth approval for the channel owner, backend upload logic, database updates, and frontend display changes.

Because your application already supports property video upload, this is a good candidate for integration.

---

## 1. Current app status

Your app already has property video support.

Current implementation:
- Property video table exists in Prisma: `PropertyVideo`
- Upload API exists: `web/src/app/api/properties/[id]/videos/route.ts`
- Agent create page uploads a video file after property save
- Agent edit page uploads/removes video
- Buyer and agent property detail pages display video from `playbackUrl`

Important current behavior:
- The app stores a **direct playable file URL** in `playbackUrl`
- Frontend uses HTML `<video src="..." controls>`

That means the current code expects a raw file URL like:
- `/uploads/properties/123/video_123.mp4`

YouTube does **not** return a raw MP4 playback URL for your app to use in a `<video>` tag.
It returns a **YouTube video ID / watch URL / embed URL**.

So if you move to YouTube, frontend display must change from:
- native `<video>` player

to:
- embedded YouTube iframe

---

## 2. Is YouTube a good idea?

### Good when:
- You want videos hosted on your official YouTube channel
- You want to save storage/bandwidth on your own infrastructure
- You want YouTube processing, thumbnails, and reliability
- You are okay with YouTube branding/player behavior

### Not ideal when:
- You want completely private internal-only videos
- You need full control over playback UI
- You want instant upload-to-play without processing delay
- You do not want YouTube branding, related videos, or external platform dependency

### Recommended publishing mode
For real estate property videos, best practical choice is usually:
- `unlisted`

Why:
- video is not fully public in your channel listing unless you want that
- can still be embedded in your app
- easier than private-share logic

---

## 3. Best implementation approach for this app

### Recommended architecture
1. Agent uploads property video from app
2. App backend sends that file to YouTube Data API
3. YouTube returns `videoId`
4. App stores YouTube metadata in DB
5. Property page renders embedded YouTube player
6. Agent can later replace or remove the linked YouTube video

### What should be stored in DB
Your current `PropertyVideo` model has:
- `playbackUrl`
- `posterUrl`
- `durationSec`
- `status`

For YouTube integration, better fields are:
- `provider` → `local` or `youtube`
- `youtubeVideoId`
- `youtubeWatchUrl`
- `embedUrl`
- `thumbnailUrl`
- `title` (optional)
- `status`
- `durationSec`

If you want minimum schema change, you could keep using:
- `playbackUrl` = embed URL
- `posterUrl` = thumbnail URL
- `status`

But a better long-term design is to explicitly store provider + YouTube fields.

---

## 4. Important Google / YouTube limitation

YouTube uploads for a normal channel require **OAuth 2.0 user authorization**.

Important:
- A normal service account is **not enough** for standard YouTube channel uploads.
- You need the Google account that owns the YouTube channel to authorize the app.
- Usually you do this once, obtain a **refresh token**, and store it securely.

That means your application channel owner must complete the OAuth consent flow once.

---

## 5. High-level integration changes needed in this repo

## Backend changes
- Extend `PropertyVideo` model
- Add YouTube API helper module
- Update `POST /api/properties/[id]/videos`
- Update `DELETE /api/properties/[id]/videos`
- Add env variables for Google OAuth credentials

## Frontend changes
- Update property create/edit pages to upload via YouTube-backed route
- Update property view pages to embed YouTube video instead of using native `<video>` when provider is `youtube`

## CI/CD / secrets changes
- Add YouTube API secrets to Secret Manager / cloud runtime env
- Document production setup

---

## 6. Step-by-step implementation plan

## Step 1 — Create Google Cloud project (or reuse existing)
1. Open Google Cloud Console
2. Select project or create a new project
3. Enable billing if required

## Step 2 — Enable YouTube Data API v3
1. Go to **APIs & Services**
2. Click **Enable APIs and Services**
3. Search for **YouTube Data API v3**
4. Enable it

## Step 3 — Configure OAuth consent screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose app type
3. Fill app name, support email, developer contact
4. Save configuration

If app is internal-only, keep access limited where possible.

## Step 4 — Create OAuth client credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials**
3. Choose **OAuth client ID**
4. Create **Web application**
5. Add redirect URI that your app will use for callback

Example callback route you may create later:
- `/api/integrations/youtube/oauth/callback`

## Step 5 — Authorize the application channel owner account
1. Log in with the Google account that owns your YouTube channel
2. Start OAuth flow
3. Approve YouTube upload permissions
4. Capture and store the returned refresh token securely

Required scope usually includes YouTube upload/manage scope.

## Step 6 — Add environment variables
Add these as app secrets/env variables:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`
- `YOUTUBE_REFRESH_TOKEN`
- `YOUTUBE_CHANNEL_ID` (optional but useful)

If using GCP deployment, store them in Secret Manager.

---

## 7. Application code changes needed

## Step 7.1 — Update Prisma schema
Recommended schema extension:

```prisma
model PropertyVideo {
  id             Int      @id @default(autoincrement())
  active         Boolean  @default(true)
  propertyId     Int
  property       Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  provider       String   @default("local")
  playbackUrl    String
  posterUrl      String?
  youtubeVideoId String?
  embedUrl       String?
  durationSec    Int?
  status         String   @default("processing")
  createdAt      DateTime @default(now())
}
```

Suggested meaning:
- `provider = "youtube"` when stored video is on YouTube
- `playbackUrl` can hold watch URL or embed URL
- `embedUrl` keeps iframe-ready URL
- `youtubeVideoId` stores the canonical identifier

Then run:
- `npm run db:generate`
- `npm run db:push`

---

## Step 7.2 — Add YouTube helper module
Create helper file, for example:
- `web/src/lib/youtube.ts`

This module should:
- create OAuth client from env vars
- refresh access token using refresh token
- upload video file to YouTube
- return:
  - `videoId`
  - `watchUrl`
  - `embedUrl`
  - `thumbnailUrl`
  - `processing status`

Suggested helper responsibilities:
- `getYouTubeAccessToken()`
- `uploadPropertyVideoToYouTube(file, metadata)`
- `deleteYouTubeVideo(videoId)`

---

## Step 7.3 — Update video upload API
Current route:
- `web/src/app/api/properties/[id]/videos/route.ts`

Current behavior:
- validates file
- saves file under `public/uploads/...`
- writes direct URL to DB

New YouTube behavior:
1. validate file size, mime type, duration
2. upload binary to YouTube instead of local disk
3. receive `videoId`
4. build:
   - watch URL: `https://www.youtube.com/watch?v=VIDEO_ID`
   - embed URL: `https://www.youtube.com/embed/VIDEO_ID`
   - thumbnail URL from response
5. save DB record with provider=`youtube`
6. return saved video metadata to frontend

---

## Step 7.4 — Update delete video API
Current route also deletes local files.

For YouTube provider, delete flow should:
1. read `youtubeVideoId` from DB
2. call YouTube delete API
3. remove DB row

If you want safer behavior, you may instead:
- keep video on YouTube
- only unlink from property in DB

Recommended business choice:
- **unlink only** first, unless you are sure the same video is not reused elsewhere

---

## Step 7.5 — Update frontend display components
These files currently display video using native HTML video element:
- `web/src/app/properties/[id]/page.tsx`
- `web/src/app/agent/properties/[id]/page.tsx`
- `web/src/app/agent/properties/[id]/edit/page.tsx`

Current logic uses:
- `vid.playbackUrl`
- `<video src={...} controls />`

For YouTube, change logic to:
- if provider is `youtube` or `embedUrl` exists → render iframe
- else → render native `<video>`

Example render approach:

```tsx
<iframe
  src={video.embedUrl}
  title="Property video"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowFullScreen
  className="h-full w-full rounded-xl"
/>
```

---

## Step 7.6 — Update post/edit flow
Current upload pages:
- `web/src/app/agent/post-property/page.tsx`
- `web/src/app/agent/properties/[id]/edit/page.tsx`

Good news:
- these pages already call `/api/properties/{id}/videos`
- so frontend changes may be small if API response shape stays compatible

Main UI improvement to add:
- show upload status like:
  - `Uploading to YouTube...`
  - `Processing on YouTube...`
- show note that YouTube may take time to process HD playback

---

## 8. Display strategy inside application

If uploaded video is on YouTube, use one of these approaches:

### Option A — embed YouTube iframe (recommended)
Pros:
- simplest
- official player
- reliable

Cons:
- YouTube branding
- less UI control

### Option B — link out to YouTube watch page
Pros:
- simplest fallback

Cons:
- worse user experience
- leaves your app

Best recommendation for your app:
- **Embed iframe in property view page**

---

## 9. Suggested business rules

Recommended property video policy:
- maximum 1 YouTube video per property
- format: mp4 / webm / mov
- max duration: keep current 120 seconds or increase slightly if needed
- visibility: `unlisted`
- title pattern:
  - `Property: {property.title} | {city}`
- description pattern:
  - property summary + app link + agent name
- tags:
  - city, property type, buy/rent

---

## 10. Suggested metadata sent to YouTube

When uploading, send metadata like:
- title
- description
- tags
- category
- privacy status = `unlisted`

Suggested title format:
- `1 BHK rent at Bangla Center | Vinjamuru | Real Estate Service`

Suggested description format:
- property title
- city/address
- listing type
- app detail URL
- contact handled inside your app

---

## 11. Security considerations

- Never expose `YOUTUBE_CLIENT_SECRET` to frontend
- Never expose `YOUTUBE_REFRESH_TOKEN` to frontend
- Upload to YouTube must happen on server side only
- Store secrets in env / Secret Manager
- Restrict admin access to YouTube integration settings if you add a settings UI

---

## 12. Important YouTube processing behavior

Even after upload succeeds:
- the video may not be immediately playable in all resolutions
- thumbnail may appear a little later
- embed may work after a short processing delay

So app should support statuses like:
- `uploading`
- `processing`
- `ready`
- `failed`

Recommended UI behavior:
- after upload, show `Video uploaded. YouTube is processing it.`
- if ready, render embed player
- if still processing, show message instead of broken player

---

## 13. Recommended implementation phases

## Phase 1 — Planning and credentials
- Create Google API credentials
- Get refresh token from channel owner account
- Decide video privacy mode

## Phase 2 — Data model
- Extend `PropertyVideo` schema
- Save provider + YouTube metadata

## Phase 3 — Backend integration
- Add `youtube.ts` helper
- Update upload/delete API routes
- Add status handling

## Phase 4 — Frontend rendering
- Render iframe for YouTube videos
- Show processing/error states

## Phase 5 — Production deployment
- Add YouTube secrets in runtime env
- Test upload from staging
- Confirm channel ownership and policy compliance

---

## 14. Is full integration possible right now?

Technically: **yes**

Practically in this environment: **partially**

What can be done immediately in code:
- schema preparation
- provider-aware video model
- frontend embed support
- backend structure for YouTube uploads

What still requires your external credentials/actions:
- Google Cloud project setup
- YouTube Data API enablement
- OAuth client creation
- channel-owner authorization
- refresh token generation

Without those credentials, the live upload-to-YouTube part cannot be fully tested end-to-end.

---

## 15. Best recommendation for your application

### Recommended answer
Yes, integrate it — but do it in a controlled way.

Best approach:
- Keep current local upload working as fallback
- Add a new provider mode: `youtube`
- When provider is `youtube`, upload to YouTube and embed the result
- When provider is `local`, keep current behavior

This gives you:
- safer rollout
- no downtime
- easy fallback if YouTube quota/policy/processing causes issues

---

## 16. Minimal code change strategy

If you want the smallest-risk version:

1. Keep current DB model with small extensions only
2. Keep current `/api/properties/[id]/videos` route
3. Replace local write logic with provider switch:
   - `VIDEO_PROVIDER=local`
   - `VIDEO_PROVIDER=youtube`
4. On frontend:
   - if URL is YouTube embed → render iframe
   - else render native video

This is the safest rollout path for your current codebase.

---

## 17. What I can integrate next in code

I can help implement this in phases.

### Phase A — safe scaffold
I can add:
- provider-ready Prisma schema changes
- YouTube env placeholders
- provider-aware frontend video rendering
- backend structure/stubs for YouTube upload

### Phase B — real YouTube integration
After you provide Google credentials, I can add:
- OAuth token usage
- actual YouTube upload API calls
- delete/unlink behavior
- production-ready secret handling

---

## 18. Final answer

Yes, this is possible.

For your app, the correct approach is:
- upload property video from app
- send it to YouTube from backend
- store YouTube video metadata in DB
- display it in app using embedded iframe

It should not use the current raw `<video>` flow for YouTube.
That part must change.
