export type PropertyVideoRecord = {
  id: number;
  provider?: string | null;
  playbackUrl: string;
  posterUrl?: string | null;
  youtubeVideoId?: string | null;
  embedUrl?: string | null;
  durationSec?: number | null;
  status?: string | null;
};

export function isYouTubeVideo(video: PropertyVideoRecord): boolean {
  return video.provider === "youtube" || Boolean(video.youtubeVideoId) || /youtube\.com|youtu\.be/.test(video.playbackUrl) || Boolean(video.embedUrl);
}

export function getVideoEmbedUrl(video: PropertyVideoRecord): string {
  if (video.embedUrl) return video.embedUrl;
  if (video.youtubeVideoId) return `https://www.youtube.com/embed/${video.youtubeVideoId}`;
  return video.playbackUrl;
}

export function getVideoPosterUrl(video: PropertyVideoRecord): string | null {
  if (video.posterUrl) return video.posterUrl;
  if (video.youtubeVideoId) return `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
  return null;
}