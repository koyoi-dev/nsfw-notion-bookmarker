import {
  Badge,
  BadgeProps,
  Box,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { NextLink } from '@mantine/next';
import { IconSearch } from '@tabler/icons';
import Head from 'next/head';
import NextImage from 'next/image';
import { Fragment } from 'react';
import Layout from '../../components/Layout';
import { useQuerySearch } from '../../hooks/useQueryState';
import { trpc } from '../../utils/trpc';

export default function NHentaiPage() {
  const [search, setSearch] = useQuerySearch('');
  const theme = useMantineTheme();
  const {
    isLoading,
    isSuccess,
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.useInfiniteQuery(['nhentai.search', { query: search }], {
    enabled: !!search,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <Layout>
      <Head>
        <title>NSFW Bookmarker | nhentai</title>
      </Head>
      <Title order={1} mb='xl'>
        nhentai.net
      </Title>

      <TextInput
        placeholder='Search'
        icon={<IconSearch size={16} stroke={1.5} />}
        autoComplete='off'
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

      <SimpleGrid
        cols={3}
        spacing='md'
        mt='xl'
        breakpoints={[
          { minWidth: 'md', cols: 4 },
          { minWidth: 'lg', cols: 5 },
        ]}
      >
        {isLoading &&
          [...Array(15)].map((_, i) => <Skeleton key={i} height={280} />)}
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
      </SimpleGrid>
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
