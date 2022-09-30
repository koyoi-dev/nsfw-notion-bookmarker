import {
  Button,
  Image,
  Paper,
  SimpleGrid,
  SimpleGridProps,
  Skeleton,
  Text,
  TextInput,
  TextInputProps,
  Title,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { NextLink } from '@mantine/next';
import { IconSearch } from '@tabler/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { trpc } from '../../utils/trpc';

export default function JavActressesPage() {
  const router = useRouter();
  const search = router.query.search as string;
  const [query, setQuery] = useDebouncedState(search ?? '', 800);

  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(['jav-actress.search', { query }], {
    enabled: !!query,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <Layout>
      <Head>
        <title>NSFW Bookmarker | Jav Actress</title>
      </Head>
      <Title order={1} mb='xl'>
        Jav Actress
      </Title>

      <SearchBox
        defaultValue={query}
        onChange={(event) => {
          const currentSearch = event.currentTarget.value;

          if (currentSearch === '') {
            router.push('/jav-actress', undefined, { shallow: true });
          } else {
            router.push(`/jav-actress?search=${currentSearch}`, undefined, {
              shallow: true,
            });
          }
          setQuery(currentSearch);
        }}
      />

      <ResponsiveGrid mt='xl' loading={isLoading}>
        {isSuccess &&
          data.pages.map((page, i) => (
            <Fragment key={i}>
              {page.results.map((actress) => (
                <Paper
                  key={actress.slug}
                  component={NextLink}
                  href={`/jav-actress/${actress.slug}`}
                >
                  <Image
                    src={`${actress.thumbnail}?fit=cover&width=200&height=300&quality=100`}
                    alt={actress.name}
                    imageProps={{
                      loading: 'lazy',
                    }}
                    radius='md'
                  />

                  <Text
                    size='sm'
                    mt={5}
                    lineClamp={2}
                    weight={500}
                    sx={(theme) => ({
                      [theme.fn.smallerThan('md')]: {
                        fontSize: theme.fontSizes.xs,
                      },
                    })}
                  >
                    {actress.name}
                  </Text>
                </Paper>
              ))}
            </Fragment>
          ))}
        <Button
          onClick={() => fetchNextPage()}
          disabled={!hasNextPage || isFetchingNextPage}
        >
          {isFetchingNextPage
            ? 'Loading more...'
            : hasNextPage
            ? 'Load More'
            : 'Nothing'}
        </Button>
      </ResponsiveGrid>
    </Layout>
  );
}

type SearchBoxProps = TextInputProps;
const SearchBox = (props: SearchBoxProps) => {
  return (
    <TextInput
      placeholder='Search'
      icon={<IconSearch size={16} stroke={1.5} />}
      autoComplete='off'
      {...props}
    />
  );
};

type ResponsiveGridProps = {
  loading: boolean;
} & SimpleGridProps;
const ResponsiveGrid = ({ loading, ...props }: ResponsiveGridProps) => {
  return (
    <SimpleGrid
      cols={3}
      spacing='md'
      breakpoints={[{ minWidth: 'md', cols: 5 }]}
      {...props}
    >
      {loading
        ? [...Array(15)].map((_, i) => <Skeleton key={i} height={280} />)
        : props.children}
    </SimpleGrid>
  );
};
