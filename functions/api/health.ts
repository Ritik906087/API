import { getDatabase, isConfigured, Env } from '../_utils/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const hasMongo = isConfigured(context.env.MONGODB_URI);
  const hasSupabase = isConfigured(context.env.SUPABASE_JWT_SECRET) || isConfigured(context.env.SB_SECRET_KEY);
  
  let mongoStatusStr = "unconfigured_sandbox";
  if (hasMongo) {
    try {
      const db = await getDatabase(context.env);
      if (db) {
        await db.command({ ping: 1 });
        mongoStatusStr = "healthy";
      } else {
        mongoStatusStr = "connection_failed";
      }
    } catch(e) {
      mongoStatusStr = "error_connecting";
    }
  }

  return new Response(JSON.stringify({
    success: true,
    status: "ok",
    engine: "Cloudflare Pages Functions native",
    timestamp: new Date().toISOString(),
    database: {
      provider: hasMongo && mongoStatusStr === "healthy" ? "mongodb_atlas" : "sandbox_in_memory",
      connection: mongoStatusStr,
      database: context.env.MONGODB_DB_NAME || "cloudflare_backend"
    },
    supabase: {
      has_client_config: isConfigured(context.env.SUPABASE_URL) || isConfigured(context.env.SB_PROJECT_URL),
      has_jwt_secret: hasSupabase,
      using_development_key: !hasSupabase
    }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

// Fallback handling to explicitly return 405 Method Not Allowed on non-GET methods
export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method;
  return new Response(JSON.stringify({ 
    error: "Method Not Allowed", 
    message: `HTTP method ${method} is not supported on this endpoint. Use GET /api/health instead.` 
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
