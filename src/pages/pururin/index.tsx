import { Button, Chip, Image, Paper, Text, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { NextLink } from '@mantine/next';
import {
  queryTypes,
  SetValues,
  useQueryStates,
  UseQueryStatesKeysMap,
} from 'next-usequerystate';
import Head from 'next/head';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { SearchBox } from '../../components/SearchBox';
import {
  PururinSearchSortBy,
  PURURIN_SEARCH_SORT,
} from '../../server/modules/pururin/schema';
import { trpc } from '../../utils/trpc';

const usePururinQuery = () => {
  const [query, setQuery] = useQueryStates({
    search: queryTypes.string.withDefault(''),
    sort: queryTypes
      .stringEnum(PURURIN_SEARCH_SORT)
      .withDefault(PururinSearchSortBy.TITLE),
  });
  const [debounced] = useDebouncedValue(query, 800);

  type PururinQuery = UseQueryStatesKeysMap<typeof query>;
  type PururinSetQuery = SetValues<PururinQuery>;
  return {
    query,
    setQuery,
    debounced,
  };
};

export default function PururinPage() {
  const { query, setQuery, debounced } = usePururinQuery();

  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(
    ['pururin.search', { query: debounced.search, sort: debounced.sort }],
    {
      enabled: !!debounced.search,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <Layout>
      <Head>
        <title>Pururin</title>
      </Head>

      <Title order={1} mb='xl'>
        pururin.to
      </Title>

      <SearchBox
        placeholder='Search for doujin'
        value={query.search}
        onChange={(e) =>
          setQuery((prev) => ({ ...prev, search: e.currentTarget.value }))
        }
      />
      <Chip.Group
        mt='md'
        multiple={false}
        value={query.sort}
        onChange={(value: PururinSearchSortBy) => setQuery({ sort: value })}
      >
        {PURURIN_SEARCH_SORT.map((sort) => (
          <Chip key={sort} value={sort} radius='md'>
            {sort}
          </Chip>
        ))}
      </Chip.Group>

      <ResponsiveGrid mt='xl' skeleton={isLoading} skeletonHeight={250}>
        {isSuccess &&
          data.pages.map((page) => (
            <Fragment key={page.nextCursor}>
              {page.results.map((doujin) => (
                <Paper
                  key={doujin.id}
                  component={NextLink}
                  href={`/pururin/${doujin.id}`}
                  style={{ position: 'relative' }}
                >
                  <Image
                    src={doujin.image_url}
                    alt={doujin.title}
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
                    {doujin.title}
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
