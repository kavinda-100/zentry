import React from 'react';

export function ZentryLoginButton({ className = '', label = 'Login with Zentry' }) {
  return <button className={className}>{label}</button>;
}

export function ZentryLogoutButton({ className = '', label = 'Sign Out' }) {
  return <button className={className}>{label}</button>;
}
