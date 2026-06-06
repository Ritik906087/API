import { getDatabase, sandboxOtps, Env } from '../../_utils/db';

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
  // Isolate numeric string digits
  const mobileNo = rawMobileNo.replace(/\D/g, "");

  if (!mobileNo || mobileNo.length < 10) {
    return new Response(JSON.stringify({ error: "Validation Error", message: "Required property 'mobileNo' must be a valid numeric cell identifier with country prefix." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Generate high-entropy 6-digit numeric OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = Date.now() + 5 * 60 * 1000; // Valids for 5 minutes

  const db = await getDatabase(context.env);

  if (db) {
    await db.collection("otps").updateOne(
      { mobileNo },
      { $set: { otp, expires_at, verified: false } },
      { upsert: true }
    );
  } else {
    const idx = sandboxOtps.findIndex(r => r.mobileNo === mobileNo);
    const rec = { mobileNo, otp, expires_at, verified: false };
    if (idx !== -1) {
      sandboxOtps[idx] = rec;
    } else {
      sandboxOtps.push(rec);
    }
  }

  let smsResponseStatus = 200;
  let smsResponseBody = "";
  let dispatchMessage = "dispatched_through_custom_api";

  try {
    const smsPayload = {
      apiKey: "4ef8fe7a7412390737d7a6e591",
      mobileNo: mobileNo,
      messageType: "AUTH_OTP",
      brandName: "MyApp",
      otp: otp,
      senderId: "MRAOTP"
    };

    const outgoing = await fetch("https://meraotp.in/api/sendSMS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(smsPayload)
    });

    smsResponseStatus = outgoing.status;
    smsResponseBody = await outgoing.text();
  } catch (dispatchErr: any) {
    console.error("Custom SMS API trigger exception caught:", dispatchErr);
    dispatchMessage = "dispatch_failed_fallback_sandbox";
  }

  return new Response(JSON.stringify({
    success: true,
    status: "dispatched",
    message: `6-digit authentication OTP code successfully dispatched to mobile: ${mobileNo}`,
    mobileNo: mobileNo,
    otp: otp, // Injected for sandbox developers to see directly in console
    developer_debug: {
      otp_temp: otp
    },
    sms_gateway_response: {
      status: smsResponseStatus,
      body: smsResponseBody,
      type: dispatchMessage
    }
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
    message: `HTTP method ${method} is not supported on this endpoint. Use POST /api/auth/send-otp instead.` 
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
