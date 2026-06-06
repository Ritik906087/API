import { ObjectId } from 'mongodb';
import { getDatabase, sandboxDb, verifyJWT, Env } from '../../_utils/db';

export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method;
  const targetId = (context.params.id as string || "").trim();

  if (!targetId) {
    return new Response(JSON.stringify({ error: "Bad Request", message: "Target Item ID segment is required in URL path." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const authHeader = context.request.headers.get("Authorization");
  let verifiedUser: any = null;

  const defaultSecret = context.env.SB_SECRET_KEY || "Sb_secret_AM5vimCGkSivzxs8o-_Hjw_D64rvl74";
  const jwtSecret = context.env.SUPABASE_JWT_SECRET || defaultSecret;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    verifiedUser = await verifyJWT(token, jwtSecret);
  }

  const db = await getDatabase(context.env);

  // 1. GET: Fetch item detail by ID
  if (method === "GET") {
    if (db) {
      try {
        const matchedMongo = await db.collection("items").findOne({ _id: new ObjectId(targetId) });
        if (!matchedMongo) {
          return new Response(JSON.stringify({ error: "Not Found", message: `Record with id '${targetId}' was not found in live Atlas.` }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify({
          id: matchedMongo._id.toString(),
          title: matchedMongo.title,
          description: matchedMongo.description,
          category: matchedMongo.category,
          owner_id: matchedMongo.owner_id,
          owner_email: matchedMongo.owner_email,
          owner_phone: matchedMongo.owner_phone || "",
          status: matchedMongo.status,
          created_at: matchedMongo.created_at,
          updated_at: matchedMongo.updated_at
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch(e) {
        return new Response(JSON.stringify({ error: "Bad Request", message: "The item ID must be a valid 24 hex character format for MongoDB ObjectId." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else {
      const memoryMatch = sandboxDb.find(i => i.id === targetId);
      if (!memoryMatch) {
         return new Response(JSON.stringify({ error: "Not Found", message: `Record with id '${targetId}' was not found in sandbox.` }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(memoryMatch), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 2. PUT: Update item state parameters (Authentication & ownership validated)
  if (method === "PUT") {
    if (!verifiedUser) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Unauthorized request. Correct Supabase JWT Bearer token is required." }), {
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

    const ownerPhone = verifiedUser.phone || "";

    if (db) {
      try {
        const item = await db.collection("items").findOne({ _id: new ObjectId(targetId) });
        if (!item) {
          return new Response(JSON.stringify({ error: "Not Found", message: `No active records match the provided ID '${targetId}' in Atlas.` }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Ensure requestor owns the record
        if (item.owner_phone !== ownerPhone && item.owner_id !== verifiedUser.sub) {
          return new Response(JSON.stringify({ error: "Forbidden", message: "Ownership claim mismatch. You can only update records you created." }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }

        const updateFields: any = { updated_at: new Date().toISOString() };
        if (body.title !== undefined) updateFields.title = String(body.title).trim();
        if (body.description !== undefined) updateFields.description = String(body.description).trim();
        if (body.category !== undefined) updateFields.category = String(body.category).trim();
        if (body.status !== undefined) updateFields.status = body.status === "completed" ? "completed" : "pending";

        await db.collection("items").updateOne(
          { _id: new ObjectId(targetId) },
          { $set: updateFields }
        );

        const updatedDoc = await db.collection("items").findOne({ _id: new ObjectId(targetId) });
        return new Response(JSON.stringify({
          success: true,
          message: "Record updated successfully",
          item: {
            id: updatedDoc!._id.toString(),
            title: updatedDoc!.title,
            description: updatedDoc!.description,
            category: updatedDoc!.category,
            owner_id: updatedDoc!.owner_id,
            owner_email: updatedDoc!.owner_email,
            owner_phone: updatedDoc!.owner_phone || "",
            status: updatedDoc!.status,
            created_at: updatedDoc!.created_at,
            updated_at: updatedDoc!.updated_at
          }
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch(e) {
        return new Response(JSON.stringify({ error: "Bad Request", message: "Failed updating record: Ensure item ID is a valid hex code." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else {
      const itemIdx = sandboxDb.findIndex(i => i.id === targetId);
      if (itemIdx === -1) {
        return new Response(JSON.stringify({ error: "Not Found", message: `No active records match structural ID '${targetId}' in local memory.` }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      const itemObj = sandboxDb[itemIdx];
      if (itemObj.owner_phone !== ownerPhone && itemObj.owner_id !== verifiedUser.sub) {
        return new Response(JSON.stringify({ error: "Forbidden", message: "Ownership claim mismatch. You can only update records you created." }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (body.title !== undefined) itemObj.title = String(body.title).trim();
      if (body.description !== undefined) itemObj.description = String(body.description).trim();
      if (body.category !== undefined) itemObj.category = String(body.category).trim();
      if (body.status !== undefined) itemObj.status = body.status === "completed" ? "completed" : "pending";
      itemObj.updated_at = new Date().toISOString();

      return new Response(JSON.stringify({
        success: true,
        message: "Record updated successfully in sandbox",
        item: itemObj
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 3. DELETE: Delete target item (Authentication & ownership validated)
  if (method === "DELETE") {
    if (!verifiedUser) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Unauthorized request. Correct Supabase JWT Bearer token is required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ownerPhone = verifiedUser.phone || "";

    if (db) {
      try {
        const item = await db.collection("items").findOne({ _id: new ObjectId(targetId) });
        if (!item) {
          return new Response(JSON.stringify({ error: "Not Found", message: `No active records match the provided ID '${targetId}' in Atlas.` }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (item.owner_phone !== ownerPhone && item.owner_id !== verifiedUser.sub) {
          return new Response(JSON.stringify({ error: "Forbidden", message: "Ownership claim mismatch. You can only delete records you created." }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }

        await db.collection("items").deleteOne({ _id: new ObjectId(targetId) });
        return new Response(JSON.stringify({
          success: true,
          message: `Record with ID '${targetId}' deleted successfully.`
        }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch(e) {
        return new Response(JSON.stringify({ error: "Bad Request", message: "Failed deleting record: Ensure item ID is a valid hex code." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else {
      const itemIdx = sandboxDb.findIndex(i => i.id === targetId);
      if (itemIdx === -1) {
        return new Response(JSON.stringify({ error: "Not Found", message: `No active records match structural ID '${targetId}' in local memory.` }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      const itemObj = sandboxDb[itemIdx];
      if (itemObj.owner_phone !== ownerPhone && itemObj.owner_id !== verifiedUser.sub) {
        return new Response(JSON.stringify({ error: "Forbidden", message: "Ownership claim mismatch. You can only delete records you created." }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      sandboxDb.splice(itemIdx, 1);
      return new Response(JSON.stringify({
        success: true,
        message: `Record with ID '${targetId}' deleted successfully from sandbox.`
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Method not supported fallback
  return new Response(JSON.stringify({ error: "Method Not Allowed", message: `HTTP method ${method} is not supported on this endpoint. Use GET, PUT, or DELETE.` }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
export const onRequestGet = onRequest;
export const onRequestPut = onRequest;
export const onRequestDelete = onRequest;
