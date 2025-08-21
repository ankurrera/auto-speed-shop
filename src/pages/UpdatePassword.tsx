import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UpdatePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Please enter your new password.');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        // This listener checks for auth state changes, including 'PASSWORD_RECOVERY'
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                if (session && session.user) {
                    setShowForm(true);
                }
            }
        });

        // Handle cases where the event is missed on the initial page load
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setShowForm(true);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handlePasswordUpdate = async () => {
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
            <div>
                <p>Loading...</p>
                <p>If you were redirected here from a password reset email, you will be prompted to update your password shortly.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-md">
            <h2>Set New Password</h2>
            <p className="text-muted-foreground">{statusMessage}</p>
            <div className="space-y-4">
                <Input 
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <Button onClick={handlePasswordUpdate} disabled={isUpdating || newPassword.length < 6}>
                    {isUpdating ? "Updating..." : "Update Password"}
                </Button>
            </div>
        </div>
    );
};

export default UpdatePassword;