import { Button, Image, Paper, Text, Title } from '@mantine/core';
import { NextLink } from '@mantine/next';
import Head from 'next/head';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { SearchBox } from '../../components/SearchBox';
import { useQuerySearch } from '../../hooks/useQueryState';
import { trpc } from '../../utils/trpc';

export default function JavActressesPage() {
  const [search, setSearch] = useQuerySearch('');

  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(['jav-actress.search', { query: search }], {
    enabled: !!search,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <Layout>
      <Head>
        <title>Jav Actress</title>
      </Head>
      <Title order={1} mb='xl'>
        Jav Actress
      </Title>

      <SearchBox
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

      <ResponsiveGrid mt='xl' skeleton={isLoading}>
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
