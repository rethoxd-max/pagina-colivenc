import { environment } from '../../../environments/environment';

export function isPdf(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.startsWith('data:application/pdf') || u.endsWith('.pdf');
}

export function isImageFile(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(u);
}

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${environment.apiUrl}/${url.replace(/^\/+/, '')}`;
}
