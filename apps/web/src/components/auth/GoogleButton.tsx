import { Button } from '#/components/ui/button.tsx';
import { FcGoogle } from 'react-icons/fc';
import { cn } from '#/lib/utils.ts';
import { useMutation } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { getMeServerFn } from '#/server-fns/auth';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LAST_AUTHENTICATED_METHOD, SESSION_TOKEN_KEY } from '#/constants';
import { useLocalStorage } from '#/hooks/useLocalStorage.ts';
import type { LastAuthenticatedMethodType } from '#/types';
import AuthLastBadge from '#/components/auth/AuthLastBadge.tsx';

type GoogleButtonProps = {
  classnames?: string;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setShowAlert: Dispatch<SetStateAction<boolean>>;
};

const GoogleButton = ({ classnames, setShowAlert, setErrorMessage }: GoogleButtonProps) => {
  const navigate = useNavigate();
  const { setItemToLocalStorage, getItemFromLocalStorage } = useLocalStorage();
  const lastAuthenticatedMethod =
    getItemFromLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => getMeServerFn(),
  });

  const handleGoogleLogin = () => {
    setShowAlert(false);
    setErrorMessage(null);

    mutate(undefined, {
      onError: (error) => {
        console.error('Google login error:', error);
        setShowAlert(true);
        setErrorMessage(error.message ?? 'Google login failed. Please try again later.');
      },
      onSuccess: async (response) => {
        console.log('Google login successful');
        setItemToLocalStorage<string>(SESSION_TOKEN_KEY, response.session.token);
        setItemToLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD, 'google');
        await navigate({
          to: '/overview',
        });
      },
    });
  };

  return (
    <div className={cn('flex w-full flex-col gap-3', classnames)}>
      <p className="text-center text-xs text-muted-foreground">Or</p>
      <div className="relative">
        {lastAuthenticatedMethod === 'google' ? <AuthLastBadge /> : null}
        <Button
          className="w-full cursor-pointer"
          variant="outline"
          disabled={isPending}
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="h-5 w-5" />
          {isPending ? <Loader2Icon className="size-4 animate-spin" /> : 'Continue with Google'}
        </Button>
      </div>
    </div>
  );
};
export default GoogleButton;
