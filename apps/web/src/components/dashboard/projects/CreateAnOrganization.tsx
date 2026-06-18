import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const CreateAnOrganization = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create an Organization</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Create an Organization</DialogTitle>
          <DialogDescription>
            Enter your organization&apos;s name, description, and logo.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
export default CreateAnOrganization;
