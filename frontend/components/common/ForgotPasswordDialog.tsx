import React, { useState } from 'react';
import { KeyRound, X, CheckCircle, Mail, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

interface ForgotPasswordDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response: any = await apiService.auth.forgotPassword(email);

            if (response.success) {
                // Show success state inside the popup
                setShowSuccess(true);
                // Toast is also good
                toast.success(response.message);

                // Close after delay
                setTimeout(() => {
                    setShowSuccess(false);
                    onClose();
                    setEmail('');
                }, 2000);
            } else {
                setError(response.message || 'Failed to process request');
            }
        } catch (err: any) {
            console.error('Forgot Password error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to process request';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="animate-in zoom-in-95 duration-300 w-full max-w-md">
                <Card className="w-full bg-white dark:bg-gray-800 border-0 shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="text-center pb-6 relative pt-8">
                        <div className="absolute right-4 top-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 h-auto w-auto"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 transform transition-transform duration-500 hover:rotate-6">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>

                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            Forgot Password?
                        </CardTitle>
                        <p className="text-base text-gray-600 dark:text-gray-300 mt-2 px-4 max-w-xs mx-auto">
                            Enter your registered email address and we'll send you a temporary password.
                        </p>
                    </CardHeader>

                    <CardContent className="pb-8 px-8">
                        {showSuccess ? (
                            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Sent!</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-base">
                                    Please check your inbox for the temporary password.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="reset-email" className="text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">
                                        Email Address
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError(null);
                                            }}
                                            className="pl-10 h-12 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 rounded-xl text-base"
                                            disabled={loading}
                                        />
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg animate-in slide-in-from-top-1">
                                            <p className="font-medium">{error}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Reset Password
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
