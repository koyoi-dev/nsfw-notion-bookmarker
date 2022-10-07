import { Button, Image, Paper, Text, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { NextLink } from '@mantine/next';
import { queryTypes, useQueryStates } from 'next-usequerystate';
import Head from 'next/head';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { SearchBox } from '../../components/SearchBox';
import { trpc } from '../../utils/trpc';

const useHanimeQuery = () => {
  const [query, setQuery] = useQueryStates({
    search: queryTypes.string.withDefault(''),
  });

  const [debounced] = useDebouncedValue(query, 800);

  return {
    query,
    setQuery,
    debounced,
  };
};

export default function HanimePage() {
  const { query, setQuery, debounced } = useHanimeQuery();

  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(['hanime.search', { query: debounced.search }], {
    enabled: !!debounced.search,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <Layout>
      <Head>
        <title>Hanime</title>
      </Head>

      <Title order={1} mb='xl'>
        Hanime
      </Title>

      <SearchBox
        placeholder='Search for hanime'
        value={query.search}
        onChange={(e) =>
          setQuery((prev) => ({ ...prev, search: e.target.value }))
        }
      />

      <ResponsiveGrid mt='xl' skeleton={isLoading} skeletonHeight={250}>
        {isSuccess &&
          data.pages.map((page) => (
            <Fragment key={page.nextCursor}>
              {page.results.map((hanime) => (
                <Paper
                  key={hanime.id}
                  component={NextLink}
                  href={`/hanime/${hanime.id}`}
                  style={{ position: 'relative' }}
                >
                  <Image
                    src={hanime.cover_url}
                    alt={hanime.name}
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
                    {hanime.name}
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
