import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPAndResetRequest {
  email: string;
  otp: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, otp, newPassword }: VerifyOTPAndResetRequest = await req.json();

    if (!email || !otp || !newPassword) {
      console.error("Missing required fields:", { email, otp: !!otp, newPassword: !!newPassword });
      return new Response(
        JSON.stringify({ error: "Email, OTP, and new password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Corrected code: Use a direct API call to get the user by email
    const { data: existingUser, error: userError } = await (async () => {
        try {
            const response = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
                        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    },
                }
            );

            if (!response.ok) {
                return { data: null, error: new Error(`API Error: ${response.statusText}`) };
            }

            const data = await response.json();
            // The API returns a `users` array, so we extract the first user
            const user = data.users.length > 0 ? data.users[0] : null;

            return { data: { user }, error: null };
        } catch (err: any) {
            return { data: null, error: err };
        }
    })();
    
    if (userError || !existingUser?.user) {
      console.error("User not found:", email);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify OTP
    const { data: otpData, error: otpError } = await supabaseClient
      .from("otp_codes")
      .select("*")
      .eq("user_id", existingUser.user.id)
      .eq("otp_code", otp)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      console.error("Invalid or expired OTP:", otp);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Reset password using admin API
    const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
      existingUser.user.id,
      { password: newPassword }
    );

    if (resetError) {
      console.error("Error resetting password:", resetError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Delete the used OTP
    const { error: deleteError } = await supabaseClient
      .from("otp_codes")
      .delete()
      .eq("user_id", existingUser.user.id);

    if (deleteError) {
      console.error("Error deleting OTP code:", deleteError);
    }

    console.log("Password reset successfully for user:", email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in verify-otp-and-reset-password function:", error);
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
