/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  readonly VITE_DEFAULT_LANGUAGE?: string;
  readonly VITE_SUPPORTED_LANGUAGES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
