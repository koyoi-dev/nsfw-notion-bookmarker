import { Stack, StackProps, TextProps, Text, Title } from '@mantine/core';

type SectionStackChildrenProps = {
  title: string;
  textProps?: TextProps;
} & StackProps;
type SectionStackProps = { title: string } & StackProps;

function SectionStack({ title, ...props }: SectionStackProps) {
  return (
    <section>
      <Title order={4} mb='sm'>
        {title}
      </Title>
      <Stack spacing='xs' {...props}>
        {props.children}
      </Stack>
    </section>
  );
}

function SectionStackChildren({
  title,
  textProps,
  ...props
}: SectionStackChildrenProps) {
  return (
    <Stack spacing='xs' {...props}>
      <Text color='dimmed' weight={500} size='sm' {...textProps}>
        {title}
      </Text>
      {props.children}
    </Stack>
  );
}

SectionStack.Children = SectionStackChildren;

export { SectionStack };
