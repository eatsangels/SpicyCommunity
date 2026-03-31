import AuthForm from '@/components/auth/AuthForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat grayscale-[0.2] brightness-[0.4]"
        style={{ backgroundImage: 'url("/uno.jpg")' }}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
