import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";

export function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = isSignUp ? await signUp(email, password, fullName) : await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-white to-gold-50 px-4 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-600 text-white">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">WeddingPass</span>
          </Link>
          <h1 className="mt-6 font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {isSignUp ? "Start creating beautiful wedding invitations" : "Sign in to manage your weddings"}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Field label="Full Name">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="pl-10" />
              </div>
            </Field>
          )}
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" />
            </div>
          </Field>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <Link to={isSignUp ? "/login" : "/signup"} className="font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400">
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
