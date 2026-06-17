import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '#/components/ui/card.tsx';
import { Button } from '#/components/ui/button.tsx';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <Card className="w-96 justify-self-center">
        <CardHeader>
          <CardTitle>Welcome to TanStack Start</CardTitle>
          <CardDescription>
            Edit <code>src/routes/index.tsx</code> to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a simple card component.</p>
        </CardContent>
        <CardFooter>
          <Button>Click me</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
