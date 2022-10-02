import { Button, Image, Paper, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { NextLink } from '@mantine/next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { SearchBox } from '../../components/SearchBox';
import { trpc } from '../../utils/trpc';

export default function JavActressesPage() {
  const router = useRouter();
  const form = useForm({
    initialValues: {
      search: (router.query.search as string) || '',
    },

    validate: {
      search: (value) => (value.length < 1 ? 'Search is required' : null),
    },
  });

  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.useInfiniteQuery(
    ['jav-actress.search', { query: form.values.search }],
    {
      enabled: false,
      refetchOnWindowFocus: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const handleSubmit = async (value: typeof form.values) => {
    refetch();
    router.push(
      {
        pathname: router.pathname,
        query: {
          search: value.search,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <Layout>
      <Head>
        <title>Jav Actress</title>
      </Head>
      <Title order={1} mb='xl'>
        jav-actress
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <SearchBox {...form.getInputProps('search')} />
        <Button mt='md' type='submit'>
          Submit query
        </Button>
      </form>

      <ResponsiveGrid mt='xl' skeleton={isLoading}>
        {isSuccess &&
          data.pages.map((page) => (
            <Fragment key={page.nextCursor}>
              {page.result.map((actress) => (
                <Paper
                  key={actress.slug}
                  component={NextLink}
                  href={`/jav-actress/${actress.slug}`}
                >
                  <Image
                    src={actress.thumbnail || undefined}
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
