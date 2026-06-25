import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '#/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card.tsx';
import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field.tsx';
import { Textarea } from '#/components/ui/textarea.tsx';
import { useUpdateMemberPermissions } from '#/hooks/org/members/useUpdateMemberPermissions.ts';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';
import { memberDetailsResponseSchema } from '#/zod/org';
import { MemberActionAlert } from '#/components/dashboard/projects/member/MemberActionAlert.tsx';
import { getErrorMessage, stringifyPermissions } from '#/components/dashboard/projects/member/utils.ts';

type MemberDetails = z.infer<typeof memberDetailsResponseSchema>;

type UpdateMemberPermissionsCardProps = {
  projectId: string;
  memberId: string;
  member: MemberDetails;
};

export function UpdateMemberPermissionsCard({
  projectId,
  memberId,
  member,
}: UpdateMemberPermissionsCardProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdateMemberPermissions(projectId, memberId);
  const [permissionsText, setPermissionsText] = useState(stringifyPermissions(member.permissions));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setPermissionsText(stringifyPermissions(member.permissions));
  }, [member.permissions]);

  const parsedPermissions = useMemo(() => {
    if (!permissionsText.trim()) {
      return { success: true as const, data: null };
    }

    try {
      return { success: true as const, data: JSON.parse(permissionsText) as unknown };
    } catch {
      return { success: false as const, error: 'Permissions must be valid JSON.' };
    }
  }, [permissionsText]);

  const handleSave = () => {
    if (!parsedPermissions.success) {
      return;
    }

    setErrorMessage(null);

    mutate(
      { permissions: parsedPermissions.data },
      {
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, 'Failed to update member permissions.'));
        },
        onSuccess: async () => {
          toast.success('Member permissions updated.');
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: orgMemberQueryKey(projectId, memberId) }),
            queryClient.invalidateQueries({ queryKey: ['org', projectId] }),
          ]);
        },
      },
    );
  };

  const handleClear = () => {
    setPermissionsText('');
    setErrorMessage(null);
  };

  return (
    <Card className="border border-(--line) bg-(--surface) shadow-none">
      <CardHeader className="border-b border-(--line) pb-5">
        <CardTitle>Update Permissions</CardTitle>
        <CardDescription>
          Edit member-specific permissions as JSON, or clear the field to store no custom permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {errorMessage ? (
          <MemberActionAlert
            title="Permissions update failed"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}

        <Field data-invalid={!parsedPermissions.success}>
          <FieldLabel htmlFor="member-permissions-json">Permissions JSON</FieldLabel>
          <Textarea
            id="member-permissions-json"
            value={permissionsText}
            onChange={(event) => setPermissionsText(event.target.value)}
            aria-invalid={!parsedPermissions.success}
            disabled={isPending}
            placeholder={`{\n  "canInviteUsers": true,\n  "allowedDomains": ["example.com"]\n}`}
            spellCheck={false}
            className="min-h-48 font-mono text-xs"
          />
          <FieldDescription>
            Leave this blank to save <span className="font-mono text-foreground">null</span>.
          </FieldDescription>
          {!parsedPermissions.success ? <FieldError>{parsedPermissions.error}</FieldError> : null}
        </Field>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-(--line) pt-5 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" disabled={isPending} onClick={handleClear}>
          <Trash2 className="size-4" />
          Clear field
        </Button>
        <Button type="button" disabled={isPending || !parsedPermissions.success} onClick={handleSave}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save permissions
        </Button>
      </CardFooter>
    </Card>
  );
}
