import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import applyiqIcon from '@/assets/images/applyiq-icon.png';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await register(firstName, lastName, email, password);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-black px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={applyiqIcon} alt="ApplyIQ" className="h-9 w-9 rounded-md" />
            <span className="text-xl font-bold tracking-tight text-white">
              Apply<span className="text-sky-400">IQ</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-white/60">
            Start tracking applications and scoring your resume, free.
          </p>
        </div>

        <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
          <CardHeader className="sr-only">Sign up</CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName" className="text-white/80">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    required
                    placeholder="Caleb"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-white/15 bg-black/40 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName" className="text-white/80">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    required
                    placeholder="Kim"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-white/15 bg-black/40 text-white"
                  />
                </div>
              </div>
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
                  minLength={8}
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
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sky-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
