import {
  Badge,
  BadgeProps,
  Box,
  Button,
  Chip,
  Group,
  Paper,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { NextLink } from '@mantine/next';
import { queryTypes, useQueryStates } from 'next-usequerystate';
import Head from 'next/head';
import NextImage from 'next/image';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { ResponsiveGrid } from '../../components/ResponsiveGrid';
import { SearchBox } from '../../components/SearchBox';
import { NHENTAI_SORT_BY } from '../../schema/nhentai.schema';
import { trpc } from '../../utils/trpc';

const useNhentaiQuery = () => {
  const [query, setQuery] = useQueryStates({
    search: queryTypes.string.withDefault(''),
    sort: queryTypes
      .stringEnum<NHENTAI_SORT_BY>(Object.values(NHENTAI_SORT_BY))
      .withDefault(NHENTAI_SORT_BY.POPULAR),
  });
  const [debounced] = useDebouncedValue(query, 800);

  return {
    query,
    setQuery,
    debounced,
  };
};

export default function NHentaiPage() {
  const { query, setQuery, debounced } = useNhentaiQuery();
  const theme = useMantineTheme();
  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(
    ['nhentai.search', { query: debounced.search, sort: debounced.sort }],
    {
      enabled: !!debounced.search,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  return (
    <Layout>
      <Head>
        <title>nhentai</title>
      </Head>
      <Title order={1} mb='xl'>
        nhentai.net
      </Title>

      <SearchBox
        value={query.search}
        onChange={(event) =>
          setQuery((q) => ({ ...q, search: event.target.value }))
        }
      />

      <Chip.Group
        mt='md'
        multiple={false}
        value={query.sort}
        onChange={(value: NHENTAI_SORT_BY) =>
          setQuery((q) => ({ ...q, sort: value }))
        }
      >
        {Object.values(NHENTAI_SORT_BY).map((sort) => (
          <Chip key={sort} value={sort} radius='md'>
            {sort}
          </Chip>
        ))}
      </Chip.Group>

      <ResponsiveGrid mt='xl' skeleton={isLoading}>
        {isSuccess &&
          data.pages.map((page, i) => (
            <Fragment key={i}>
              {page.result.map((doujin) => (
                <Paper
                  key={doujin.id}
                  component={NextLink}
                  href={`/nhentai/${doujin.id}`}
                >
                  <Box
                    sx={{
                      '> span': {
                        display: 'block !important',
                        height: '100% !important',
                      },
                    }}
                  >
                    <NextImage
                      src={doujin.cover}
                      width={190}
                      height={269}
                      style={{ borderRadius: theme.radius.sm }}
                    />
                  </Box>

                  <Group mt={5} spacing={5}>
                    {doujin.language.map((language) => (
                      <LanguageBadge
                        key={language || 'unknown'}
                        language={language}
                        size='xs'
                        mt={5}
                        radius='xs'
                      />
                    ))}
                  </Group>

                  <Text
                    size='sm'
                    lineClamp={2}
                    weight={500}
                    sx={(theme) => ({
                      [theme.fn.smallerThan('md')]: {
                        fontSize: theme.fontSizes.xs,
                      },
                    })}
                  >
                    {doujin.title.pretty ||
                      doujin.title.english ||
                      doujin.title.japanese}
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

const LanguageBadge = ({
  language,
  ...props
}: { language?: string } & BadgeProps) => {
  return (
    <Badge
      {...props}
      color={
        language === 'japanese'
          ? 'red'
          : language === 'english'
          ? 'blue'
          : 'yellow'
      }
    >
      {language}
    </Badge>
  );
};
