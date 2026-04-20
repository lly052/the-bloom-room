import { useState } from 'react';
import { supabase } from '../utils/supabase';

// ---------------------------------------------------------------------------
// LoginPage
//
// This component shows a simple email + password login form.
// When the user logs in successfully, we call onLoginSuccess() which
// tells the parent (App.tsx) to show the main app instead of this page.
//
// If the user doesn't have an account yet, they can click "Sign up"
// to switch to the sign up page.
// ---------------------------------------------------------------------------

interface LoginPageProps {
  onLoginSuccess: () => void;   // called when login works
  onGoToSignUp: () => void;     // called when user clicks "Sign up"
}

export function LoginPage({ onLoginSuccess, onGoToSignUp }: LoginPageProps) {
  // Store what the user types into the form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Show a loading spinner while we wait for Supabase to respond
  const [isLoading, setIsLoading] = useState(false);

  // If something goes wrong, store the error message so we can show it
  const [errorMessage, setErrorMessage] = useState('');

  // This function runs when the user clicks "Log In"
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    // Stop the browser from refreshing the page on form submit
    e.preventDefault();

    // Clear any old error and show the loading state
    setErrorMessage('');
    setIsLoading(true);

    // Ask Supabase to log in with the email and password the user typed
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (error) {
      // Login failed — show the error message to the user
      setErrorMessage(error.message);
    } else {
      // Login worked — tell App.tsx to show the main app
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header / branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">The Bloom Room</h1>
          <p className="text-slate-500">Sign in to manage your orders</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl text-slate-900 mb-6">Log In</h2>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm text-slate-700">
                Email address
              </label>
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

            {/* Password field */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            {/* Error message — only shows if something went wrong */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {errorMessage}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

          </form>

          {/* Link to sign up page */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <button
              onClick={onGoToSignUp}
              className="text-slate-900 underline hover:text-slate-600"
            >
              Sign up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
