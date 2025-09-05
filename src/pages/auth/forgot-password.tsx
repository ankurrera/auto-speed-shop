// src/pages/auth/forgot-password.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePasswordReset = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setStatusMessage('');
        setIsSuccess(false);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            // For security, do not reveal if an email does not exist in the database.
            // Just show a generic success message to prevent user enumeration attacks.
            setStatusMessage('If an account exists with that email, a password reset link has been sent. Please check your inbox.');
            setIsSuccess(true);
            console.error(error); // Log the actual error for debugging
        } else {
            // Success
            setStatusMessage('A password reset link has been sent to your email. Please check your inbox.');
            setIsSuccess(true);
        }

        setIsLoading(false);
    };

    return (
        <div className="container mx-auto px-4 py-16 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Forgot Your Password?</h2>
            <p className="mb-6 text-gray-600">
                Enter your email address below and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handlePasswordReset}>
                <div className="space-y-4">
                    <Input 
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading || isSuccess}
                    />
                    <Button 
                        type="submit"
                        disabled={isLoading || isSuccess}
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </div>
            </form>

            {statusMessage && (
                <div className={`mt-6 p-4 rounded-lg ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {statusMessage}
                </div>
            )}
        </div>
    );
};

export default ForgotPassword;