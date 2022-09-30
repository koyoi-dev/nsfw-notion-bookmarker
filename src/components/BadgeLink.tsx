import { BadgeProps, Badge } from '@mantine/core';

type BadgeLinkProps = {
  url: string;
} & BadgeProps;
export const BadgeLink = ({ url, ...props }: BadgeLinkProps) => {
  return (
    <Badge
      component='a'
      rel='noopener noreferrer'
      href={url}
      target='_blank'
      variant={props.variant ?? 'filled'}
      color={props.color ?? 'gray'}
      radius={props.radius ?? 'sm'}
      {...props}
    />
  );
};
