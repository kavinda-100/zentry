import { useMutation } from '@tanstack/react-query';
import { apiWithOrg } from '#/lib/axios.ts';
import { type OrgUserRegisterSchemaType } from '@zentry/validation';
import { createOkResponseSchema } from '#/zod';
import { orgUserAuthFlowResponseSchema } from '#/zod/org/auth';
import { ORG_ID_HEADER } from '#/constants';

type OrgUserRegisterProps = {
  orgId: string;
  callbackUrl: string;
  state: string;
  data: OrgUserRegisterSchemaType;
};

export function useOrgUserRegister() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (props: OrgUserRegisterProps) => {
      const { orgId, callbackUrl, state, data } = props;
      const response = await apiWithOrg.post(
        `/auth/org/register?callbackUrl=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(state)}`,
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
