import { createFileRoute, Link } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';
import { loginSchema, type LoginSchemaType } from '@zentry/validation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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
