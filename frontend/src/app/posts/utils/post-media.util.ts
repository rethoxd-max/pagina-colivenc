import { environment } from '../../../environments/environment';

export function isPdf(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.startsWith('data:application/pdf') || u.endsWith('.pdf');
}

export function getPostMediaUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  return `${environment.apiUrl}/${imageUrl.replace(/^\/+/, '')}`;
}
