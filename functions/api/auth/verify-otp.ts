import { getDatabase, sandboxUsers, sandboxOtps, createJWT, Env } from '../../_utils/db';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: any = {};
  try {
    body = await context.request.json();
  } catch(e) {
    return new Response(JSON.stringify({ error: "Bad Request", message: "Malformed or empty JSON payload body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const rawMobileNo = body.mobileNo || "";
  const mobileNo = rawMobileNo.replace(/\D/g, "");
  const inputOtp = (body.otp || "").toString().trim();

  if (!mobileNo || !inputOtp) {
    return new Response(JSON.stringify({ error: "Validation Error", message: "Required request properties 'mobileNo' and 'otp' must not be empty." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const db = await getDatabase(context.env);
  let isValidOtp = false;

  if (db) {
    const matchedRecord = await db.collection("otps").findOne({ mobileNo });
    if (matchedRecord && matchedRecord.otp === inputOtp && matchedRecord.expires_at > Date.now() && !matchedRecord.verified) {
      isValidOtp = true;
      // Consume token to prevent replay
      await db.collection("otps").updateOne({ mobileNo }, { $set: { verified: true } });
    }
  } else {
    // Local memory checking
    const rec = sandboxOtps.find(r => r.mobileNo === mobileNo);
    if (rec && rec.otp === inputOtp && rec.expires_at > Date.now() && !rec.verified) {
      isValidOtp = true;
      rec.verified = true;
    } else if (inputOtp === "803213") {
      // Direct pass debug code
      isValidOtp = true;
    }
  }

  if (!isValidOtp) {
    return new Response(JSON.stringify({ error: "Unauthorized", message: "Verification failed. The OTP code is either incorrect, expired (5m duration), or already consumed." }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  let userId = "";
  let dbUserCreatedAt = new Date().toISOString();

  if (db) {
    const userObj = await db.collection("users").findOne({ phone: mobileNo });
    if (userObj) {
      userId = userObj._id.toString();
      dbUserCreatedAt = userObj.created_at || dbUserCreatedAt;
    } else {
      const result = await db.collection("users").insertOne({
        phone: mobileNo,
        created_at: new Date().toISOString()
      });
      userId = result.insertedId.toString();
    }
  } else {
    const existing = sandboxUsers.find(u => u.phone === mobileNo);
    if (existing) {
      userId = existing.id;
      dbUserCreatedAt = existing.created_at;
    } else {
      userId = "user_atlas_" + Math.random().toString(36).substr(2, 9);
      const newUser = { id: userId, phone: mobileNo, created_at: new Date().toISOString() };
      sandboxUsers.push(newUser);
    }
  }

  const defaultSecret = context.env.SB_SECRET_KEY || "Sb_secret_AM5vimCGkSivzxs8o-_Hjw_D64rvl74";
  const jwtSecret = context.env.SUPABASE_JWT_SECRET || defaultSecret;

  // Build standard structured Supabase claims list
  const claims = {
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // Valid for 7 days
    sub: userId,
    phone: mobileNo,
    email: `${mobileNo}@phone-auth.com`,
    role: "authenticated",
    user_metadata: {
      provider: "phone",
      phone: mobileNo
    }
  };

  const token = await createJWT(claims, jwtSecret);

  return new Response(JSON.stringify({
    success: true,
    message: "Session successfully established for cellular access subscriber " + mobileNo,
    token,
    user: {
      id: userId,
      phone: mobileNo,
      created_at: dbUserCreatedAt
    },
    claims
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

// Fallback method blocking
export const onRequest: PagesFunction<Env> = async (context) => {
  const method = context.request.method;
  return new Response(JSON.stringify({ 
    error: "Method Not Allowed", 
    message: `HTTP method ${method} is not supported on this endpoint. Use POST /api/auth/verify-otp instead.` 
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
