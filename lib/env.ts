const value = (...names: string[]) => names.map((name) => process.env[name]).find(Boolean);
export const env = {
  supabaseUrl: value('NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_digimark101_SUPABASE_URL'),
  supabaseKey: value('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_digimark101_SUPABASE_PUBLISHABLE_KEY', 'digimark101_SUPABASE_ANON_KEY'),
  gatewayToken: value('AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN'),
};
