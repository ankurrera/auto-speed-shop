import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Please enter your new password.');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Log URL parameters for debugging
        console.log('Current URL:', window.location.href);
        console.log('URL params:', new URLSearchParams(window.location.search).toString());
        console.log('Hash:', window.location.hash);

        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log('Session check:', { session, error });
            
            if (error) {
                console.error('Error fetching session:', error.message);
                setStatusMessage('An error occurred. Please try the password reset process again.');
            } else if (session) {
                // If a session exists, the user has been redirected from the email link
                console.log('Session found, showing form');
                setShowForm(true);
            } else {
                // No session found, likely an invalid or expired link
                console.log('No session found');
                setStatusMessage('Invalid or expired password reset link. Please request a new one.');
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event, session);
            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery event detected');
                setShowForm(true);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handlePasswordUpdate = async () => {
        setError('');
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsUpdating(true);
        setStatusMessage('Updating password...');
        
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            setStatusMessage("Failed to update password: " + error.message);
            console.error(error);
        } else {
            setStatusMessage("Password updated successfully! You will be redirected to the login page.");
            setTimeout(() => {
                window.location.href = '/account'; 
            }, 3000);
        }
        setIsUpdating(false);
    };

    if (!showForm) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-md text-center">
                <p>Loading...</p>
                <p>If you were redirected here from a password reset email, you will be prompted to update your password shortly.</p>
                <p>{statusMessage}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-md">
            <h2>Set New Password</h2>
            {error && <p className="text-red-500">{error}</p>}
            <div className="space-y-4">
                <Input 
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <Input 
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <Button onClick={handlePasswordUpdate} disabled={isUpdating || newPassword.length < 6 || newPassword !== confirmPassword}>
                    {isUpdating ? "Updating..." : "Update Password"}
                </Button>
            </div>
        </div>
    );
};

export default ResetPassword;