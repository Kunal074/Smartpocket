import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In | SmartPocket',
  description: 'Sign in to your SmartPocket account',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-accent/30 blur-[120px]" />
      </div>

      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl shadow-inner">
          ✨
        </div>
      </div>

      <LoginForm />
    </div>
  );
}
