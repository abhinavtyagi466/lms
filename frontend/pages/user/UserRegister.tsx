import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { toast } from 'sonner';

export const UserRegister: React.FC = () => {
  const { setCurrentPage } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.auth.register(formData);
      toast.success('Registration successful! Please login.');
      setCurrentPage('user-login');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Create Account</h1>
          <p className="text-gray-600">Join our learning platform</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter your full name"
              className="mt-1"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Enter your phone number"
              className="mt-1"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email"
              className="mt-1"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input 
              id="password" 
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Create a password"
              className="mt-1"
              disabled={isLoading}
              required
            />
          </div>
          
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={() => setCurrentPage('user-login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};