export const onRequest: PagesFunction = async (context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  // Immediate OPTIONS handling (all CORS preflight requests)
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const response = await context.next();
    
    // Non-modifying clone logic: prevent immutability issues with Response Headers
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error: any) {
    console.error("Cloudflare Pages Gateway Error Captured by Middleware:", error);
    const status = error.status || 500;
    const message = error.message || error.toString() || "Internal gateway processing exception.";

    return new Response(JSON.stringify({ 
      error: status === 401 ? "Unauthorized" : "Internal Server Error", 
      message 
    }), {
      status,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    });
  }
};
export const onRequestOptions = onRequest;
