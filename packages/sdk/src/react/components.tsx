import React from 'react';
import { useZentry } from './context';

interface ButtonProps {
  className?: string;
  label?: string;
}

/**
 * @description Register Button
 * @returns A button component
 * @param className - The class name of the button
 * @param label - The label of the button
 * */
export const RegisterButton = ({ className = '', label = 'Register' }: ButtonProps) => {
  const { register } = useZentry();
  return (
    <button onClick={register} className={className}>
      {label}
    </button>
  );
};

/**
 * @description Login Button
 * @returns A button component
 * @param className - The class name of the button
 * @param label - The label of the button
 * */
export function LoginButton({ className = '', label = 'Login' }: ButtonProps) {
  const { login } = useZentry();
  return (
    <button onClick={login} className={className}>
      {label}
    </button>
  );
}

/**
 * @description Logout Button
 * @returns A button component
 * @param className - The class name of the button
 * @param label - The label of the button
 * */
export function LogoutButton({ className = '', label = 'LogOut' }: ButtonProps) {
  const { logout } = useZentry();
  return (
    <button
      onClick={async () => {
        await logout();
      }}
      className={className}
    >
      {label}
    </button>
  );
}

/**
 * @description Authenticated Component
 * @returns A component that renders its children if the user is authenticated
 * @param children - The children to render if the user is authenticated
 * */
export const Authenticated = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useZentry();
  return isAuthenticated ? <>{children}</> : null;
};

/**
 * @description UnAuthenticated Component
 * @returns A component that renders its children if the user is not authenticated
 * @param children - The children to render if the user is not authenticated
 * */
export const UnAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useZentry();
  return isAuthenticated ? null : <>{children}</>;
};
