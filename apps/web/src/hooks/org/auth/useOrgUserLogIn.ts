import { useMutation } from '@tanstack/react-query';
import { type OrgUserLoginSchemaType } from '@zentry/validation';
import { apiWithOrg } from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { orgUserAuthFlowResponseSchema } from '#/zod/org/auth.ts';
import { ORG_ID_HEADER } from '#/constants';

type OrgUserLogInProps = {
  orgId: string;
  callbackUrl: string;
  data: OrgUserLoginSchemaType;
};

export function useOrgUserLogIn() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (props: OrgUserLogInProps) => {
      const { orgId, callbackUrl, data } = props;
      const response = await apiWithOrg.post(
        `/org/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        data,
        {
          headers: {
            [ORG_ID_HEADER]: orgId,
          },
        },
      );
      console.log(response.data);

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
