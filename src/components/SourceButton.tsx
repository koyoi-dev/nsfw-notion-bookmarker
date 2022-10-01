import { Button, ButtonProps } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons';

type SourceButtonProps = {
  source: string;
} & ButtonProps;

export const SourceButton = ({ source, ...props }: SourceButtonProps) => {
  return (
    <Button
      component='a'
      href={source}
      target='_blank'
      rel='noopener noreferrer'
      variant='outline'
      color='blue'
      rightIcon={<IconExternalLink size={18} />}
      {...props}
    >
      {props.children ?? 'Source'}
    </Button>
  );
};
