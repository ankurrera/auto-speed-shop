import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  type: 'password_reset' | 'email_verification';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ❌ OLD CODE: You were using a single client for all operations.
    // const supabaseClient = createClient(...)

    // ✅ NEW CODE: Initialize a separate client with the service role key for admin functions.
    const supabaseServiceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, type }: SendOTPRequest = await req.json();

    if (!email || !type) {
      console.error("Missing required fields:", { email, type });
      return new Response(
        JSON.stringify({ error: "Email and type are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    console.log("Generated OTP for", email, ":", otpCode);

    // ✅ Use the new service role client to access auth.admin methods.
    const { data: existingUser, error: userError } = await supabaseServiceRoleClient.auth.admin.getUserByEmail(email);
    
    if (userError || !existingUser.user) {
      console.error("User not found:", email);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Delete any existing OTP codes for this user
    const { error: deleteError } = await supabaseServiceRoleClient
      .from("otp_codes")
      .delete()
      .eq("user_id", existingUser.user.id);

    if (deleteError) {
      console.error("Error deleting existing OTP codes:", deleteError);
    }

    // Store OTP in database
    const { error: insertError } = await supabaseServiceRoleClient
      .from("otp_codes")
      .insert([{
        user_id: existingUser.user.id,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString()
      }]);

    if (insertError) {
      console.error("Error storing OTP code:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store OTP code" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email with OTP
    const subject = type === 'password_reset' ? 'Password Reset Code' : 'Email Verification Code';
    
    const emailResponse = await resend.emails.send({
      from: "Auto Parts Store <noreply@resend.dev>",
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Auto Speed Shop</h1>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 16px;">Your Verification Code</h2>
            <p style="color: #666; margin-bottom: 20px;">
              ${type === 'password_reset' ? 'Use this code to reset your password:' : 'Use this code to verify your email:'}
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="
                font-size: 32px; 
                font-weight: bold; 
                color: #007bff; 
                background-color: #e7f3ff;
                padding: 15px 30px;
                border-radius: 8px;
                letter-spacing: 4px;
                display: inline-block;
                border: 2px dashed #007bff;
              ">${otpCode}</span>
            </div>
            <p style="color: #666; margin-top: 20px;">
              This code will expire in 10 minutes.
            </p>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "OTP sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
