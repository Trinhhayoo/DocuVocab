const PRODUCTION_ORIGIN = "https://docu-vocab-kappa.vercel.app";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";

/** Web app origin; `WXT_API_ORIGIN` overrides the default for the build mode. */
export const API_ORIGIN: string =
  import.meta.env.WXT_API_ORIGIN ?? (import.meta.env.DEV ? DEVELOPMENT_ORIGIN : PRODUCTION_ORIGIN);
