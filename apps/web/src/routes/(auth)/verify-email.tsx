import { createFileRoute } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';

export const Route = createFileRoute('/(auth)/verify-email')({
  component: VerifyEmailComponent,
});

function VerifyEmailComponent() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Verify Email</h1>
        <p>Please check your email for the verification link.</p>
      </div>
    </AuthLayout>
  );
}
