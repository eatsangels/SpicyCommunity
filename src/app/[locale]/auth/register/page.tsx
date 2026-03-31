import AuthForm from '@/components/auth/AuthForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-dots">
      <AuthForm mode="register" />
    </div>
  );
}
