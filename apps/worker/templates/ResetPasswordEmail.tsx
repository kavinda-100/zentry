import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from 'react-email';

export const ResetPasswordEmail = ({ otp }: { otp: string }) => {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Preview> Reset Password - Zentry</Preview>
      <Tailwind>
        <Body className="bg-[#f6f9fc] font-sans">
          <Container className="bg-white my-10 mx-auto p-5 w-[465px] border border-solid border-[#eaeaea] rounded">
            <Section className="mt-8 text-center">
              <Heading className="text-black text-[24px] font-bold p-0 my-8 mx-0">Zentry</Heading>
            </Section>

            <Heading className="text-black text-[20px] font-semibold text-center p-0 my-0 mx-0">
              Reset Password
            </Heading>

            <Text className="text-[#444] text-[14px] leading-[24px] text-center mt-4">
              Reset your password by entering the code below.
            </Text>

            <Section className="bg-[#f4f4f4] rounded-lg my-8 p-4 text-center">
              <Text className="text-black text-[32px] font-mono font-bold tracking-[10px] m-0">
                {otp}
              </Text>
              <Text className="text-[#888] text-[12px] mt-2 mb-0 uppercase tracking-wider">
                Valid for 20 minutes
              </Text>
            </Section>

            <Text className="text-[#444] text-[14px] leading-[24px]">
              If you didn't request this, you can safely ignore this email. Someone might have typed
              your email address by mistake.
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-6" />

            <Section className="text-center">
              <Text className="text-[#666] text-[12px] leading-[18px]">
                Built with performance in mind by <strong>Zentry</strong>.
                <br />© {year} Zentry, Inc.
              </Text>
              <Link
                href="https://zentry.com/privacy"
                className="text-[#067df7] underline text-[12px]"
              >
                Privacy Policy
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResetPasswordEmail;
