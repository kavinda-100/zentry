import { useMutation } from '@tanstack/react-query';
import { type OrgUserVerifyEmailSchemaType } from '@zentry/validation';
import { apiWithOrg } from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { orgUserAuthFlowResponseSchema } from '#/zod/org/auth.ts';
import { ORG_ID_HEADER } from '#/constants';

type OrgUserEmailVerifyProps = {
  orgId: string;
  callbackUrl: string;
  state: string;
  data: OrgUserVerifyEmailSchemaType;
};

export function useOrgUserEmailVerify() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (props: OrgUserEmailVerifyProps) => {
      const { orgId, callbackUrl, state, data } = props;
      const response = await apiWithOrg.post(
        `/auth/org/verify-email?callbackUrl=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}`,
        data,
        {
          headers: {
            [ORG_ID_HEADER]: orgId,
          },
        },
      );
      const validator = createOkResponseSchema(orgUserAuthFlowResponseSchema);
      const validatedData = validator.safeParse(response.data);
      if (!validatedData.success) {
        console.error('Invalid response from server:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { mutate, isPending };
}
