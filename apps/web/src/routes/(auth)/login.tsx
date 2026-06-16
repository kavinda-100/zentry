import { createFileRoute, Link } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';

export const Route = createFileRoute('/(auth)/login')({
  component: LogInComponent,
});

function LogInComponent() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2">
        <p>Hello "/login"!</p>
        <Link to="/register">Don't have an account? Register here</Link>
      </div>
    </AuthLayout>
  );
}
