import { SimpleGrid, SimpleGridProps, Skeleton } from '@mantine/core';

type ResponsiveGridProps = {
  skeleton?: boolean;
  skeletonHeight?: number;
} & SimpleGridProps;

export const ResponsiveGrid = ({
  skeleton: loading,
  skeletonHeight,
  ...props
}: ResponsiveGridProps) => {
  return (
    <SimpleGrid
      cols={3}
      spacing='md'
      breakpoints={[{ minWidth: 'md', cols: 5 }]}
      {...props}
    >
      {loading
        ? [...Array(15)].map((_, i) => (
            <Skeleton key={i} height={skeletonHeight ?? 280} />
          ))
        : props.children}
    </SimpleGrid>
  );
};
