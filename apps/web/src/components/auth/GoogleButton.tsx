import { Button } from '#/components/ui/button.tsx';
import { FcGoogle } from 'react-icons/fc';
import { cn } from '#/lib/utils.ts';
import type { Dispatch, SetStateAction } from 'react';
import { LAST_AUTHENTICATED_METHOD } from '#/constants';
import { useLocalStorage } from '#/hooks/useLocalStorage.ts';
import type { LastAuthenticatedMethodType } from '#/types';
import AuthLastBadge from '#/components/auth/AuthLastBadge.tsx';
import { env } from '#/lib/env.ts';

type GoogleButtonProps = {
  classnames?: string;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setShowAlert: Dispatch<SetStateAction<boolean>>;
};

const GoogleButton = ({ classnames, setShowAlert, setErrorMessage }: GoogleButtonProps) => {
  const { setItemToLocalStorage, getItemFromLocalStorage } = useLocalStorage();
  const lastAuthenticatedMethod =
    getItemFromLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD);

  const handleGoogleLogin = () => {
    setShowAlert(false);
    setErrorMessage(null);
    setItemToLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD, 'google');

    window.location.assign(
      new URL(
        `${env.VITE_API_URL}/auth/providers/google?callbackurl=http://localhost:300/dashboard`,
      ).toString(),
    );
  };

  return (
    <div className={cn('flex w-full flex-col gap-3', classnames)}>
      <p className="text-center text-xs text-muted-foreground">Or</p>
      <div className="relative">
        {lastAuthenticatedMethod === 'google' ? <AuthLastBadge /> : null}
        <Button
          type="button"
          className="w-full cursor-pointer"
          variant="outline"
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="h-5 w-5" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
};
export default GoogleButton;
