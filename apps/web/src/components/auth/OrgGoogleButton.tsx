import { FcGoogle } from 'react-icons/fc';
import { Button } from '#/components/ui/button.tsx';
import { cn } from '#/lib/utils.ts';
import { env } from '#/lib/env.ts';

type OrgGoogleButtonProps = {
  classnames?: string;
  orgId: string;
  callbackUrl: string;
  state: string;
};

const OrgGoogleButton = ({ classnames, orgId, state, callbackUrl }: OrgGoogleButtonProps) => {
  // google auth flow for organization users.
  const startOrgGoogleAuth = () => {
    const authUrl = new URL(`${env.VITE_API_URL}/auth/org/providers/google`);
    authUrl.searchParams.set('orgId', orgId);
    authUrl.searchParams.set('callbackUrl', callbackUrl);
    authUrl.searchParams.set('state', state);

    window.location.assign(authUrl.toString());
  };

  return (
    <Button
      type="button"
      className={cn('w-full cursor-pointer', classnames)}
      variant="outline"
      onClick={() => startOrgGoogleAuth()}
    >
      <FcGoogle className="h-5 w-5" />
      Continue with Google
    </Button>
  );
};
export default OrgGoogleButton;
