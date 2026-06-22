interface ButtonProps {
  className?: string;
  label?: string;
}

export function ZentryLoginButton({ className = '', label = 'Login with Zentry' }: ButtonProps) {
  return <button className={className}>{label}</button>;
}

export function ZentryLogoutButton({ className = '', label = 'Sign Out' }: ButtonProps) {
  return <button className={className}>{label}</button>;
}
