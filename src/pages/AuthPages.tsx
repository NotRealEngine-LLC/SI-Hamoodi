// HAMOODI SyntheTech Intelligence — Authentication Pages (Premium Split Layout)
// Phase 03: Sign In, Sign Up, Forgot Password, Update Password, Onboarding

import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader2, Shield, Sparkles,
  Zap, Globe, Cloud, ChevronRight, Palette
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

// ============ PREMIUM SPLIT LAYOUT ============
function AuthSplitLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Left side — Brand identity (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-zinc-950 to-indigo-950" />
        
        {/* Animated orbs */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl"
          />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <span className="text-xl font-bold text-white">⬡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">HAMOODI</h1>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">SyntheTech Intelligence</p>
            </div>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-md"
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Your unified<br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                intelligence
              </span><br />
              workspace.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Create projects, converse with AI, manage knowledge — all secured in your private cloud workspace.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { icon: Cloud, label: 'Cloud Sync', desc: 'Cross-device access' },
              { icon: Shield, label: 'Private & Secure', desc: 'End-to-end RLS' },
              { icon: Zap, label: 'AI-Powered', desc: 'Puter integration' },
              { icon: Sparkles, label: 'Premium UX', desc: 'Motion & design' },
            ].map((f, i) => (
              <div key={i} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl backdrop-blur-sm">
                <f.icon size={16} className="text-violet-400 mb-1.5" />
                <p className="text-xs font-medium text-white">{f.label}</p>
                <p className="text-[10px] text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Footer */}
          <p className="text-xs text-zinc-600">
            Founded by BhaiSazzaD • SI — Synthetic Intelligence
          </p>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile background */}
        <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25 mb-3">
              <span className="text-xl font-bold text-white">⬡</span>
            </div>
            <h1 className="text-xl font-bold text-white">HAMOODI</h1>
            <p className="text-xs text-zinc-500">SyntheTech Intelligence</p>
          </div>

          {/* Form card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
            {subtitle && <p className="text-sm text-zinc-400 mb-6">{subtitle}</p>}
            {!subtitle && <div className="mb-6" />}
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============ INPUT COMPONENT ============
function AuthInput({ icon: Icon, type, placeholder, value, onChange, required, autoComplete, error }: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
          <Icon size={16} />
        </div>
        <input
          type={isPassword && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className={`w-full pl-10 pr-10 py-3 bg-zinc-800/50 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
            error ? 'border-red-500/50 focus:ring-red-500/50' : 'border-zinc-700/50 focus:ring-violet-500/50 focus:border-violet-500/50'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-1.5 ml-1">
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ============ SUBMIT BUTTON ============
function AuthButton({ children, loading, disabled, variant = 'primary' }: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const styles = variant === 'primary'
    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25'
    : 'bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50';

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.005 }}
      whileTap={{ scale: disabled ? 1 : 0.995 }}
      type="submit"
      disabled={disabled || loading}
      className={`w-full py-3 px-4 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${styles}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </motion.button>
  );
}

// ============ FEEDBACK COMPONENTS ============
function AuthError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </motion.div>
  );
}

function AuthSuccess({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400"
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
      <AuthSplitLayout title="Cloud Authentication" subtitle="Setup required">
        <div className="space-y-4">
          <AuthError message="Cloud authentication requires Supabase credentials. See .env.example for setup." />
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <p className="text-sm text-zinc-300 mb-2 font-medium">Setup steps:</p>
            <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
              <li>Create a Supabase project</li>
              <li>Copy project URL and anon key</li>
              <li>Create .env.local with credentials</li>
              <li>Run database migrations</li>
            </ol>
          </div>
          <button onClick={() => navigate('/workspace')} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all">
            Continue as Guest
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title="Welcome back" subtitle="Sign in to your HAMOODI workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>
        <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthInput icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required autoComplete="current-password" />
        
        <div className="flex justify-end">
          <button type="button" onClick={() => navigate('/auth/forgot-password')} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Forgot password?
          </button>
        </div>

        <AuthButton loading={loading}>
          Sign In <ArrowRight size={15} />
        </AuthButton>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-3 bg-zinc-900/60 text-zinc-500">or</span></div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/auth/sign-up')}
          className="w-full py-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={14} /> Create Account
        </button>

        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Continue as Guest →
        </button>
      </form>
    </AuthSplitLayout>
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!displayName.trim()) errors.displayName = 'Display name is required';
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'At least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    const result = await signUp(email, password, displayName);
    setLoading(false);

    if (result.error) {
      setError(result.error.message || 'Sign up failed');
    } else if (result.needsEmailConfirmation) {
      setNeedsConfirmation(true);
    } else {
      navigate('/onboarding');
    }
  };

  if (needsConfirmation) {
    return (
      <AuthSplitLayout title="Check your email" subtitle="Verify your account">
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center"
            >
              <Mail size={28} className="text-violet-400" />
            </motion.div>
          </div>
          <p className="text-sm text-zinc-400 text-center">
            Please check your inbox and click the verification link to activate your account.
          </p>
          <AuthSuccess message={`Verification email sent to ${email}`} />
          <button onClick={() => navigate('/auth/sign-in')} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title="Create your account" subtitle="Join the HAMOODI intelligence workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>
          {error && <AuthError message={error} />}
        </AnimatePresence>
        <AuthInput icon={User} type="text" placeholder="Display name" value={displayName} onChange={setDisplayName} required error={fieldErrors.displayName} />
        <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required autoComplete="email" error={fieldErrors.email} />
        <AuthInput icon={Lock} type="password" placeholder="Password (min 8 characters)" value={password} onChange={setPassword} required autoComplete="new-password" error={fieldErrors.password} />
        <AuthInput icon={Shield} type="password" placeholder="Confirm password" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" error={fieldErrors.confirmPassword} />

        <AuthButton loading={loading}>
          Create Account <ArrowRight size={15} />
        </AuthButton>

        <p className="text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/auth/sign-in')} className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign In
          </button>
        </p>
      </form>
    </AuthSplitLayout>
  );
}

// ============ FORGOT PASSWORD PAGE ============
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
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
      <AuthSplitLayout title="Check your email" subtitle="Password reset link sent">
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-400" />
            </motion.div>
          </div>
          <p className="text-sm text-zinc-400 text-center">
            If an account exists with this email, you will receive a password reset link shortly.
          </p>
          <button onClick={() => navigate('/auth/sign-in')} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title="Reset password" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>{error && <AuthError message={error} />}</AnimatePresence>
        <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthButton loading={loading}>Send Reset Link <ArrowRight size={15} /></AuthButton>
        <button type="button" onClick={() => navigate('/auth/sign-in')} className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1">
          <ArrowLeft size={12} /> Back to Sign In
        </button>
      </form>
    </AuthSplitLayout>
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
      <AuthSplitLayout title="Password updated" subtitle="Your password has been changed">
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-emerald-400" />
            </motion.div>
          </div>
          <p className="text-sm text-zinc-400 text-center">You can now sign in with your new password.</p>
          <button onClick={() => navigate('/auth/sign-in')} className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
            Sign In <ArrowRight size={15} />
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout title="Set new password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence>{error && <AuthError message={error} />}</AnimatePresence>
        <AuthInput icon={Lock} type="password" placeholder="New password (min 8 characters)" value={password} onChange={setPassword} required autoComplete="new-password" />
        <AuthInput icon={Shield} type="password" placeholder="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />
        <AuthButton loading={loading}>Update Password <ArrowRight size={15} /></AuthButton>
      </form>
    </AuthSplitLayout>
  );
}

// ============ AUTH CALLBACK PAGE ============
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      navigate('/auth/update-password');
    } else {
      navigate('/workspace');
    }
  }, [navigate, searchParams]);

  return (
    <AuthSplitLayout title="Authenticating..." subtitle="Please wait">
      <div className="flex justify-center py-8">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    </AuthSplitLayout>
  );
}

// ============ ONBOARDING PAGE ============
export function OnboardingPage() {
  const { user, profile, updateProfile } = useAuth();
  const { preferences, updatePreferences } = useWorkspace();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.display_name || user?.email?.split('@')[0] || '');
  const [theme, setTheme] = useState(preferences.theme);

  const handleComplete = async () => {
    if (name.trim()) {
      await updateProfile({ display_name: name.trim() });
    }
    await updatePreferences({ theme });
    navigate('/workspace');
  };

  const steps = [
    {
      title: 'Welcome to HAMOODI',
      subtitle: 'Let\'s set up your workspace',
      content: (
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-violet-500/30"
          >
            <Sparkles size={32} className="text-white" />
          </motion.div>
          <p className="text-zinc-400 text-sm">Your cloud workspace is ready. Let's personalize it.</p>
        </div>
      ),
    },
    {
      title: 'Your display name',
      subtitle: 'How should we address you?',
      content: (
        <div className="py-2">
          <AuthInput icon={User} type="text" placeholder="Display name" value={name} onChange={setName} />
        </div>
      ),
    },
    {
      title: 'Theme preference',
      subtitle: 'Choose your workspace appearance',
      content: (
        <div className="grid grid-cols-3 gap-3 py-2">
          {(['dark', 'light', 'system'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-4 rounded-xl border transition-all ${
                theme === t
                  ? 'bg-violet-500/10 border-violet-500/50 ring-2 ring-violet-500/20'
                  : 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50'
              }`}
            >
              <Palette size={20} className={`mx-auto mb-2 ${theme === t ? 'text-violet-400' : 'text-zinc-500'}`} />
              <p className={`text-xs font-medium capitalize ${theme === t ? 'text-violet-300' : 'text-zinc-400'}`}>{t}</p>
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <AuthSplitLayout title={steps[step].title} subtitle={steps[step].subtitle}>
      <div className="space-y-6">
        {steps[step].content}

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-violet-500 w-6' : 'bg-zinc-700'}`} />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleComplete} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25">
              Start Workspace <ChevronRight size={14} />
            </button>
          )}
          <button onClick={() => navigate('/workspace')} className="py-3 px-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Skip
          </button>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
