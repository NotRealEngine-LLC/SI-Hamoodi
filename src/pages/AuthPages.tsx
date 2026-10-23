// HAMOODI SyntheTech Intelligence — Authentication Pages
// Phase 03: Sign In, Sign Up, Forgot Password, Update Password

import React, { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase/config';

// Shared layout for auth pages
function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-zinc-950 via-zinc-900 to-violet-950">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4"
          >
            <span className="text-2xl font-bold text-white">⬡</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">HAMOODI</h1>
          <p className="text-sm text-zinc-400 mt-1">SyntheTech Intelligence</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-zinc-400 mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500 mt-6">
          Founded by BhaiSazzaD • SI — Synthetic Intelligence
        </p>
      </motion.div>
    </div>
  );
}

// Input component
function AuthInput({ icon: Icon, type, placeholder, value, onChange, required, autoComplete }: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
        <Icon size={18} />
      </div>
      <input
        type={isPassword && showPassword ? 'text' : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-10 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

// Submit button
function AuthButton({ children, loading, disabled }: { children: React.ReactNode; loading?: boolean; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      type="submit"
      disabled={disabled || loading}
      className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : children}
    </motion.button>
  );
}

// Error display
function AuthError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}

// Success display
function AuthSuccess({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400"
    >
      <CheckCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}

// ============ SIGN IN PAGE ============
export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    
    setLoading(true);
    setError('');
    const result = await signIn(email, password);
    setLoading(false);
    
    if (result.error) {
      setError(result.error.message || 'Sign in failed');
    } else {
      navigate('/workspace');
    }
  };

  if (!isConfigured) {
    return (
      <AuthLayout title="Cloud Authentication" subtitle="Supabase credentials required">
        <div className="space-y-4">
          <AuthError message="Cloud authentication is not yet configured. Please set up your Supabase credentials to enable sign-in." />
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <p className="text-sm text-zinc-300 mb-2">Setup steps:</p>
            <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside">
              <li>Create a Supabase project at supabase.com</li>
              <li>Copy your project URL and anon key</li>
              <li>Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY</li>
              <li>Run the database migrations</li>
            </ol>
          </div>
          <button onClick={() => navigate('/workspace')} className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all">
            Continue as Guest
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your HAMOODI workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>
        <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthInput icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required autoComplete="current-password" />
        
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate('/auth/forgot-password')} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            Forgot password?
          </button>
        </div>

        <AuthButton loading={loading}>
          Sign In <ArrowRight size={16} />
        </AuthButton>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-zinc-900 text-zinc-500">or</span></div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/auth/sign-up')}
          className="w-full py-3 px-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          Create Account
        </button>

        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Continue as Guest →
        </button>
      </form>
    </AuthLayout>
  );
}

// ============ SIGN UP PAGE ============
export function SignUpPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    const result = await signUp(email, password, displayName);
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Sign up failed');
    } else if (result.needsEmailConfirmation) {
      setNeedsConfirmation(true);
    } else {
      navigate('/workspace');
    }
  };

  if (needsConfirmation) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a verification link to your email">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Mail size={28} className="text-violet-400" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 text-center">
            Please check your inbox and click the verification link to activate your account. The link will expire in 24 hours.
          </p>
          <AuthSuccess message={`Verification email sent to ${email}`} />
          <button onClick={() => navigate('/auth/sign-in')} className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join the HAMOODI intelligence workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>
        <AuthInput icon={User} type="text" placeholder="Display name" value={displayName} onChange={setDisplayName} required />
        <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthInput icon={Lock} type="password" placeholder="Password (min 8 characters)" value={password} onChange={setPassword} required autoComplete="new-password" />
        <AuthInput icon={Shield} type="password" placeholder="Confirm password" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />

        <AuthButton loading={loading}>
          Create Account <ArrowRight size={16} />
        </AuthButton>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/auth/sign-in')} className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign In
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

// ============ FORGOT PASSWORD PAGE ============
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }

    setLoading(true);
    setError('');
    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Failed to send reset email');
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset link sent">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 text-center">
            If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder.
          </p>
          <button onClick={() => navigate('/auth/sign-in')} className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>
        <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthButton loading={loading}>
          Send Reset Link <ArrowRight size={16} />
        </AuthButton>
        <button type="button" onClick={() => navigate('/auth/sign-in')} className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1">
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </form>
    </AuthLayout>
  );
}

// ============ UPDATE PASSWORD PAGE ============
export function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');
    const result = await updatePassword(password);
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Failed to update password');
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password updated" subtitle="Your password has been changed successfully">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 text-center">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <button onClick={() => navigate('/auth/sign-in')} className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            Sign In <ArrowRight size={16} />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>
        <AuthInput icon={Lock} type="password" placeholder="New password (min 8 characters)" value={password} onChange={setPassword} required autoComplete="new-password" />
        <AuthInput icon={Shield} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />
        <AuthButton loading={loading}>
          Update Password <ArrowRight size={16} />
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

// ============ AUTH CALLBACK PAGE ============
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  React.useEffect(() => {
    // Handle OAuth callback
    const type = searchParams.get('type');
    if (type === 'recovery') {
      navigate('/auth/update-password');
    } else {
      navigate('/workspace');
    }
  }, [navigate, searchParams]);

  return (
    <AuthLayout title="Authenticating..." subtitle="Please wait while we complete your sign-in">
      <div className="flex justify-center py-8">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    </AuthLayout>
  );
}
