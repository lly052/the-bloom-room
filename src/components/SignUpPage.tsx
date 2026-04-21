import { useState } from 'react';
import { supabase } from '../utils/supabase';

interface SignUpPageProps {
  onSignUpSuccess: () => void;
  onGoToLogin: () => void;
}

export function SignUpPage({ onSignUpSuccess, onGoToLogin }: SignUpPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else if (data.session) {
      onSignUpSuccess();
    } else {
      setSuccessMessage('Account created! Please check your email for a confirmation link, then come back and log in.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">The Bloom Room</h1>
          <p className="text-slate-500">Create an account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl text-slate-900 mb-6">Create Account</h2>

          {successMessage ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                {successMessage}
              </div>
              <button
                onClick={onGoToLogin}
                className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Go to Log In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm text-slate-700">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm text-slate-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm text-slate-700">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type your password again"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <button onClick={onGoToLogin} className="text-slate-900 underline hover:text-slate-600">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
