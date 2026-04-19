import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Create Account | SmartPocket',
  description: 'Create a new SmartPocket account to track your expenses',
};

export default function SignupPage() {
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

      <SignupForm />
    </div>
  );
}
