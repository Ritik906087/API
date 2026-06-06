import { getDatabase, sandboxDb, verifyJWT, Env } from '../_utils/db';

export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method;
  const authHeader = context.request.headers.get("Authorization");
  let verifiedUser: any = null;

  const defaultSecret = context.env.SB_SECRET_KEY || "Sb_secret_AM5vimCGkSivzxs8o-_Hjw_D64rvl74";
  const jwtSecret = context.env.SUPABASE_JWT_SECRET || defaultSecret;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    verifiedUser = await verifyJWT(token, jwtSecret);
  }

  // 1. GET: Fetch list of items (User partition filter)
  if (method === "GET") {
    const db = await getDatabase(context.env);
    const filterPhone = verifiedUser ? verifiedUser.phone : null;
    const filterId = verifiedUser ? verifiedUser.sub : null;

    if (db) {
      const query = filterPhone ? { $or: [{ owner_id: filterId }, { owner_phone: filterPhone }] } : {};
      const itemsCursor = await db.collection("items").find(query).toArray();
      const mappedItems = itemsCursor.map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        category: item.category,
        owner_id: item.owner_id,
        owner_email: item.owner_email,
        owner_phone: item.owner_phone || "",
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      return new Response(JSON.stringify(mappedItems), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const items = filterPhone 
        ? sandboxDb.filter(i => i.owner_phone === filterPhone || i.owner_id === filterId) 
        : sandboxDb;
      return new Response(JSON.stringify(items), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 2. POST: Insert new item (Authentication checked)
  if (method === "POST") {
    if (!verifiedUser) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Unauthorized request. Correct Supabase JWT Bearer token is required to construct items." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    let body: any = {};
    try {
      body = await context.request.json();
    } catch(e) {
      return new Response(JSON.stringify({ error: "Bad Request", message: "Malformed or empty JSON payload body." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return new Response(JSON.stringify({ error: "Validation Error", message: "Required property 'title' parameter is missing or empty." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const db = await getDatabase(context.env);
    const ownerId = verifiedUser.sub;
    const ownerPhone = verifiedUser.phone || "";
    const ownerEmail = verifiedUser.email || `${ownerPhone}@phone-auth.com`;

    const newItem = {
      id: "",
      title: body.title.trim(),
      description: (body.description || "").trim(),
      category: (body.category || "General").trim(),
      owner_id: ownerId,
      owner_email: ownerEmail,
      owner_phone: ownerPhone,
      status: (body.status === "completed" ? "completed" : "pending") as 'pending' | 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (db) {
      const insertResult = await db.collection("items").insertOne({
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        owner_id: newItem.owner_id,
        owner_email: newItem.owner_email,
        owner_phone: newItem.owner_phone,
        status: newItem.status,
        created_at: newItem.created_at,
        updated_at: newItem.updated_at
      });
      newItem.id = insertResult.insertedId.toString();
    } else {
      newItem.id = "sandbox_" + Math.random().toString(36).substr(2, 9);
      sandboxDb.push(newItem);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Item created successfully linked to account phone: " + ownerPhone,
      item: newItem
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Method not supported fallback
  return new Response(JSON.stringify({ error: "Method Not Allowed", message: `HTTP method ${method} is not supported on this endpoint. Use GET or POST.` }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
