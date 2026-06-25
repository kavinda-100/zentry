import { CircleAlert, X } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx';
import { Button } from '#/components/ui/button.tsx';

type MemberActionAlertProps = {
  title: string;
  message: string;
  onDismiss?: () => void;
};

export function MemberActionAlert({ title, message, onDismiss }: MemberActionAlertProps) {
  return (
    <Alert variant="destructive" className="border-destructive/25 bg-destructive/8 shadow-none">
      <CircleAlert className="mt-0.5 size-4" />
      <AlertTitle className="tracking-[0.14em] uppercase">{title}</AlertTitle>
      <AlertDescription className="leading-6 text-destructive/80">{message}</AlertDescription>
      {onDismiss ? (
        <AlertAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Dismiss error"
            className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
            onClick={onDismiss}
          >
            <X className="size-3.5" />
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
