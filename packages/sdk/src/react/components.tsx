import React from 'react';
import { useZentry } from './context';

export interface ZentryButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  label?: string;
}

const getButtonContent = (children: React.ReactNode, label: string) => {
  return children ?? label;
};

/**
 * @description Register Button
 * @returns A button component
 * @param label - The fallback label of the button
 * */
export const RegisterButton = React.forwardRef<HTMLButtonElement, ZentryButtonProps>(
  ({ label = 'Register', children, onClick, type = 'button', ...props }, ref) => {
    const { register } = useZentry();
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            register();
          }
        }}
      >
        {getButtonContent(children, label)}
      </button>
    );
  },
);

RegisterButton.displayName = 'RegisterButton';

/**
 * @description Login Button
 * @returns A button component
 * @param label - The fallback label of the button
 * */
export const LoginButton = React.forwardRef<HTMLButtonElement, ZentryButtonProps>(
  ({ label = 'Login', children, onClick, type = 'button', ...props }, ref) => {
    const { login } = useZentry();
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            login();
          }
        }}
      >
        {getButtonContent(children, label)}
      </button>
    );
  },
);

LoginButton.displayName = 'LoginButton';

/**
 * @description Logout Button
 * @returns A button component
 * @param label - The fallback label of the button
 * */
export const LogoutButton = React.forwardRef<HTMLButtonElement, ZentryButtonProps>(
  ({ label = 'LogOut', children, onClick, type = 'button', ...props }, ref) => {
    const { logout } = useZentry();
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        onClick={async (event) => {
          onClick?.(event);
          if (!event.defaultPrevented) {
            await logout();
          }
        }}
      >
        {getButtonContent(children, label)}
      </button>
    );
  },
);

LogoutButton.displayName = 'LogoutButton';

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
