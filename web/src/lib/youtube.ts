import { Readable } from "node:stream";

import { google } from "googleapis";

type UploadInput = {
  fileBuffer: Buffer;
  mimeType: string;
  title: string;
  description: string;
  tags?: string[];
};

type UploadedYouTubeVideo = {
  videoId: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  status: string;
};

function getYouTubeConfig() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const privacyStatus = process.env.YOUTUBE_DEFAULT_PRIVACY ?? "unlisted";

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    throw new Error("YouTube integration is not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI, and YOUTUBE_REFRESH_TOKEN.");
  }

  return { clientId, clientSecret, redirectUri, refreshToken, privacyStatus };
}

function getYouTubeClient() {
  const config = getYouTubeConfig();
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );

  oauth2Client.setCredentials({ refresh_token: config.refreshToken });
  return { oauth2Client, privacyStatus: config.privacyStatus };
}

export function isYouTubeUploadEnabled(): boolean {
  return (process.env.VIDEO_PROVIDER ?? "local") === "youtube";
}

export async function uploadVideoToYouTube(input: UploadInput): Promise<UploadedYouTubeVideo> {
  const { oauth2Client, privacyStatus } = getYouTubeClient();
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: input.title,
        description: input.description,
        tags: input.tags?.slice(0, 10),
        categoryId: "22",
      },
      status: {
        privacyStatus,
        embeddable: true,
      },
    },
    media: {
      mimeType: input.mimeType,
      body: Readable.from(input.fileBuffer),
    },
  });

  const videoId = response.data.id;
  if (!videoId) {
    throw new Error("YouTube upload did not return a video id.");
  }

  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    status: "processing",
  };
}

export async function deleteYouTubeVideo(videoId: string): Promise<void> {
  const { oauth2Client } = getYouTubeClient();
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  await youtube.videos.delete({ id: videoId });
}