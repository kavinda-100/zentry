import { useMutation } from '@tanstack/react-query';
import { apiWithOrg } from '#/lib/axios.ts';
import { type OrgUserRegisterSchemaType } from '@zentry/validation';
import { createOkResponseSchema } from '#/zod';
import { orgUserAuthFlowResponseSchema } from '#/zod/org/auth';
import { ORG_ID_HEADER } from '#/constants';

type OrgUserRegisterProps = {
  orgId: string;
  callbackUrl: string;
  data: OrgUserRegisterSchemaType;
};

export function useOrgUserRegister() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (props: OrgUserRegisterProps) => {
      const { orgId, callbackUrl, data } = props;
      const response = await apiWithOrg.post(
        `/org/register?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        data,
        {
          headers: {
            [ORG_ID_HEADER]: orgId,
          },
        },
      );
      console.log(response.data);

      // validate the response
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
