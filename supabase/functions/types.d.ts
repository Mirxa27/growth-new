// Ambient type declarations for Supabase Edge Functions (Deno runtime)
// These declarations are ONLY for local type-checking / IDE purposes.
// They do not affect runtime behaviour on the Deno Edge platform.

// Minimal Deno global required by submit-result function
// Extend as needed for additional Edge Functions.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

// Allow importing remote ESM modules via https://esm.sh/ URL paths without TS errors.
// Matches any version / package path.
declare module "https://esm.sh/*" {
  const mod: any;
  export = mod;
}