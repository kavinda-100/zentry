import * as React from 'react';
import { useLocalStorage } from '#/hooks/useLocalStorage.ts';
import type { LastAuthenticatedMethodType } from '#/types';
import { LAST_AUTHENTICATED_METHOD } from '#/constants';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { setItemToLocalStorage } = useLocalStorage();
  setItemToLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD, 'google');
  return <section className="flex h-screen w-full items-center justify-center">{children}</section>;
};
export default AuthLayout;
