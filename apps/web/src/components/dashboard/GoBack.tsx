import { Button } from '#/components/ui/button.tsx';
import { useRouter, useCanGoBack } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { cn } from '#/lib/utils.ts';

const GoBack = ({ className }: { className?: string }) => {
  const navigate = useRouter();
  const canGoBack = useCanGoBack();

  const handleGoBack = () => {
    if (canGoBack) {
      navigate.history.back();
    }
  };
  return (
    <Button onClick={handleGoBack} className={cn('cursor-pointer w-fit', className)} size={'sm'}>
      <ArrowLeft className={'mr-2 text-black'} />
      Go Back
    </Button>
  );
};
export default GoBack;
