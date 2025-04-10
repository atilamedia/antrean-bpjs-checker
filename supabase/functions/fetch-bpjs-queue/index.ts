
// Follow Deno standard library API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import * as crypto from "https://deno.land/std@0.177.0/crypto/mod.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cons-id, x-timestamp, x-signature, user_key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Helper function to convert string to Uint8Array
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper function to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Generate signature for BPJS API
async function generateSignature(consId: string, timestamp: string, secretKey: string): Promise<string> {
  const message = consId + "&" + timestamp;
  
  console.log(`Generating signature with consId: ${consId}, timestamp: ${timestamp}`);
  console.log(`Secret key length: ${secretKey.length}`);
  
  try {
    // Use HMAC with SHA256 for signature
    const key = await crypto.subtle.importKey(
      "raw",
      stringToBytes(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      stringToBytes(message)
    );
    
    // Convert the signature to base64
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    console.log(`Signature generated successfully: ${signature.substring(0, 10)}...`);
    return signature;
  } catch (error) {
    console.error("Error generating signature:", error);
    throw new Error(`Failed to generate signature: ${error.message}`);
  }
}

// Decrypt BPJS API response
async function decryptResponse(encryptedData: string, consId: string, secretKey: string): Promise<any> {
  try {
    const key = stringToBytes(secretKey.substring(0, 16));
    const iv = stringToBytes(consId.substring(0, 16));
    
    // Decode the base64 encrypted data
    const encryptedBytes = hexToBytes(atob(encryptedData));
    
    // Import the key for AES decryption
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      encryptedBytes
    );
    
    // Convert to string and parse as JSON
    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedText);
  } catch (error) {
    console.error("Decryption error:", error);
    return { error: "Failed to decrypt response" };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  try {
    // Get environment variables
    const BPJS_CONS_ID = Deno.env.get("BPJS_CONS_ID") || "";
    const BPJS_SECRET_KEY = Deno.env.get("BPJS_SECRET_KEY") || "";
    const BPJS_USER_KEY = Deno.env.get("BPJS_USER_KEY") || "";
    
    // Log environment variables presence (but not their values for security)
    console.log(`BPJS credentials check - CONS_ID exists: ${!!BPJS_CONS_ID}, SECRET_KEY exists: ${!!BPJS_SECRET_KEY}, USER_KEY exists: ${!!BPJS_USER_KEY}`);
    
    if (!BPJS_CONS_ID || !BPJS_SECRET_KEY || !BPJS_USER_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing BPJS API credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get date from request
    const { date } = await req.json();
    if (!date) {
      return new Response(
        JSON.stringify({ error: "Date parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Generate timestamp (UNIX timestamp in milliseconds)
    const timestamp = new Date().getTime().toString();
    
    try {
      // Generate signature
      const signature = await generateSignature(BPJS_CONS_ID, timestamp, BPJS_SECRET_KEY);
      
      // Prepare request headers
      const headers = {
        "x-cons-id": BPJS_CONS_ID,
        "x-timestamp": timestamp,
        "x-signature": signature,
        "user_key": BPJS_USER_KEY,
        "Content-Type": "application/json",
      };
      
      // Make the API call to BPJS
      const apiUrl = `https://apijkn.bpjs-kesehatan.go.id/antreanrs/antrean/pendaftaran/tanggal/${date}`;
      console.log(`Fetching data from ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });
      
      // Get response status and body for detailed error info
      const responseBody = await response.text();
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`);
        console.error(`Response body: ${responseBody}`);
        return new Response(
          JSON.stringify({ 
            error: `BPJS API error: ${response.status} ${response.statusText}`,
            details: responseBody
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Try to parse the response body
      let encryptedData;
      try {
        encryptedData = JSON.parse(responseBody);
        console.log("API response metadata:", encryptedData.metadata);
      } catch (error) {
        console.error("Invalid JSON response from API:", error);
        return new Response(
          JSON.stringify({ error: "Invalid response format from BPJS API", body: responseBody }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Check if we have the expected response structure
      if (!encryptedData.response) {
        console.error("Missing 'response' field in API response");
        return new Response(
          JSON.stringify({ error: "Missing 'response' field in API response", body: encryptedData }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Decrypt the response
      console.log("Encrypted response received, attempting decryption");
      const decryptedData = await decryptResponse(encryptedData.response, BPJS_CONS_ID, BPJS_SECRET_KEY);
      
      // Combine metadata with decrypted data
      const result = {
        response: decryptedData,
        metadata: encryptedData.metadata
      };
      
      console.log("Successfully decrypted and processed the API response");
      
      // Return the decrypted data
      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
      
    } catch (error) {
      console.error("Signature or API call error:", error);
      return new Response(
        JSON.stringify({ error: `Signature or API call error: ${error.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
  } catch (error) {
    console.error("General error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
