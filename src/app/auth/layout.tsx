export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-24 sm:pt-32 pb-10 min-h-screen">
      {children}
    </div>
  );
}
