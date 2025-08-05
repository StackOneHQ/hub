/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    readonly VITE_STACKONE_API_KEY: string;
    readonly VITE_ORIGIN_OWNER_ID: string;
    readonly VITE_ORIGIN_OWNER_NAME: string;
    readonly VITE_ORIGIN_USERNAME: string;
    readonly VITE_API_URL: string;
    readonly VITE_APP_URL: string;
}

export interface ImportMeta {
    readonly env: ImportMetaEnv;
}
