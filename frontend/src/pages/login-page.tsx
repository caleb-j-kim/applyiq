import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import applyiqIcon from '@/assets/images/applyiq-icon.png';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoginPage() {
  const { login, completeTwoFactorLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set after a correct password on an account with 2FA on: the next step asks for the code.
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (challengeToken) {
        await completeTwoFactorLogin(challengeToken, code.trim());
        navigate('/dashboard');
        return;
      }
      const result = await login(email, password);
      if (result.twoFactorRequired) {
        setChallengeToken(result.challengeToken);
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      // The challenge only lasts 5 minutes; after that the password step has to be redone.
      if (challengeToken && message.includes('expired')) {
        setChallengeToken(null);
        setCode('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark flex min-h-svh items-center justify-center bg-black px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={applyiqIcon} alt="ApplyIQ" className="h-9 w-9 rounded-md" />
            <span className="text-xl font-bold tracking-tight text-white">
              Apply<span className="text-sky-400">IQ</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/60">Log in to your ApplyIQ dashboard.</p>
        </div>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader className="sr-only">Log in</CardHeader>
          <CardContent>
            {challengeToken ? (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="code" className="text-white/80">
                    Two-factor code
                  </Label>
                  <p className="text-xs text-white/50">
                    Enter the 6-digit code from your authenticator app, or one of your recovery codes.
                  </p>
                  <Input
                    id="code"
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="border-white/15 bg-black/40 text-white tracking-widest"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="mt-2 bg-sky-500 text-white hover:bg-sky-400">
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setChallengeToken(null);
                    setCode('');
                  }}
                  className="text-xs text-white/50 hover:text-white hover:underline"
                >
                  Back to email and password
                </button>
              </form>
            ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/15 bg-black/40 text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-white/80">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/15 bg-black/40 text-white"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-sky-500 text-white hover:bg-sky-400"
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-white/50">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-sky-400 hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
