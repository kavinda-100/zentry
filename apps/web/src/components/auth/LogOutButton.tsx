import { Button } from '#/components/ui/button.tsx';
import { LiaSignOutAltSolid } from 'react-icons/lia';
import { useNavigate } from '@tanstack/react-router';
import { Loader2Icon } from 'lucide-react';
import { useLocalStorage } from '#/hooks/useLocalStorage.ts';
import { SESSION_TOKEN_KEY } from '#/constants';
import { useLogOut } from '#/hooks/auth/useLogOut.ts';

const LogOutButton = () => {
  const { removeItemFromLocalStorage } = useLocalStorage();
  const navigate = useNavigate();
  const { mutate, isPending } = useLogOut();

  const handleLogOut = () => {
    mutate(undefined, {
      onError: (error) => {
        console.error('Logout error:', error);
      },
      onSuccess: async () => {
        console.log('Logout successful');
        removeItemFromLocalStorage(SESSION_TOKEN_KEY);
        await navigate({
          to: '/',
        });
      },
    });
  };

  return (
    <Button
      type="button"
      className={'w-full cursor-pointer'}
      variant="outline"
      onClick={handleLogOut}
      disabled={isPending}
    >
      <LiaSignOutAltSolid className="h-5 w-5 mr-2" />
      {isPending ? <Loader2Icon className="animate-spin size-4" /> : 'Log out'}
    </Button>
  );
};
export default LogOutButton;
