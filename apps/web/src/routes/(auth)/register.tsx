import { createFileRoute, Link } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';

export const Route = createFileRoute('/(auth)/register')({
  component: RegisterComponent,
});

function RegisterComponent() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2">
        <p>Hello "/register"!</p>
        <Link to="/login">Already have an account? Log in here</Link>
      </div>
    </AuthLayout>
  );
}
