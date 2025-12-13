import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface ForcePasswordChangeDialogProps {
    isOpen: boolean;
    onSuccess: () => void;
}

export const ForcePasswordChangeDialog: React.FC<ForcePasswordChangeDialogProps> = ({ isOpen, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response: any = await apiService.auth.updatePassword(password);

            if (response.success) {
                setSuccess(true);
                toast.success('Password updated successfully!');
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                setError(response.message || 'Failed to update password');
            }
        } catch (err: any) {
            console.error('Update Password error:', err);
            setError(err?.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-red-900/30 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="animate-in zoom-in-95 duration-300 w-full max-w-md">
                <Card className="w-full bg-white dark:bg-gray-800 border-2 border-red-500/20 shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="text-center pb-2 pt-8 relative">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-500" />
                        </div>

                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            Security Alert
                        </CardTitle>
                        <p className="text-red-600 dark:text-red-400 font-medium mt-2 px-4 text-sm bg-red-50 dark:bg-red-900/20 py-2 rounded-lg inline-block mx-auto">
                            You are required to change your password immediately.
                        </p>
                    </CardHeader>

                    <CardContent className="pb-8 px-8 pt-4">
                        {success ? (
                            <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Success!</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-base">
                                    Your password has been updated. Redirecting...
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:ring-red-500 focus:border-red-500 rounded-xl"
                                                placeholder="Enter new password"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:ring-red-500 focus:border-red-500 rounded-xl"
                                                placeholder="Confirm new password"
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-1">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/30 transition-all duration-200"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Updating Security...
                                        </>
                                    ) : (
                                        'Change Password'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
