import { Card, CardContent, CardHeader } from '#/components/ui/card.tsx';
import { Skeleton } from '#/components/ui/skeleton.tsx';

export function MemberPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border border-(--line) bg-(--surface) shadow-none">
        <CardHeader className="space-y-4 border-b border-(--line) pb-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 md:grid-cols-[auto,1fr]">
          <Skeleton className="size-20 rounded-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border border-(--line) bg-(--surface) shadow-none">
            <CardHeader className="space-y-3 border-b border-(--line) pb-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full max-w-md" />
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
