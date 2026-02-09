type AllowedLogoMimeType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';

export const ALLOWED_LOGO_MIME_TYPES: readonly AllowedLogoMimeType[] = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
] as const;
