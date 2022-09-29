import { Button, ButtonProps } from '@mantine/core';
import { IconBrandNotion } from '@tabler/icons';
import { ButtonHTMLAttributes } from 'react';

export function NotionButton(
  props: ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <Button
      leftIcon={<IconBrandNotion size={20} />}
      variant='white'
      color='dark'
      loaderProps={{
        color: 'blue',
      }}
      {...props}
    />
  );
}
