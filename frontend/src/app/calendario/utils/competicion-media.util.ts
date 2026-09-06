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

const ICONS_POR_EXTENSION: { [ext: string]: string } = {
  png: 'fa-file-image', jpg: 'fa-file-image', jpeg: 'fa-file-image', gif: 'fa-file-image', webp: 'fa-file-image', svg: 'fa-file-image',
  pdf: 'fa-file-pdf',
  doc: 'fa-file-word', docx: 'fa-file-word',
  xls: 'fa-file-excel', xlsx: 'fa-file-excel', csv: 'fa-file-excel',
  ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
  zip: 'fa-file-archive', rar: 'fa-file-archive', '7z': 'fa-file-archive',
  mp3: 'fa-file-audio', wav: 'fa-file-audio', ogg: 'fa-file-audio',
  mp4: 'fa-file-video', mov: 'fa-file-video', avi: 'fa-file-video', mkv: 'fa-file-video',
  txt: 'fa-file-alt',
};

export function getFileIcon(nameOrUrl: string | null | undefined): string {
  if (!nameOrUrl) return 'fa-file';
  const ext = nameOrUrl.split('.').pop()?.toLowerCase() || '';
  return ICONS_POR_EXTENSION[ext] || 'fa-file';
}
