import {
  Badge,
  Box,
  Center,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconHash } from '@tabler/icons';
import Head from 'next/head';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { NotionButton } from '../../components/NotionButton';
import { SectionStack } from '../../components/SectionStack';
import { SourceButton } from '../../components/SourceButton';
import dayjs from '../../utils/dayjs';
import { trpc } from '../../utils/trpc';

export default function NHentailDetailPage() {
  const trpcContext = trpc.useContext();
  const theme = useMantineTheme();
  const query = useRouter().query;
  const id = query.id as string;

  const {
    data: doujin,
    isLoading,
    isSuccess,
  } = trpc.useQuery(['nhentai.get', { id }], {
    enabled: !!id,
  });

  const { mutate, isLoading: isSaving } = trpc.useMutation(['nhentai.save'], {
    onSuccess: ({ notion }) => {
      trpcContext.invalidateQueries(['nhentai.get', { id }]);

      const message = `Doujin saved to Notion! ${notion.url}`;
      showNotification({ title: 'Saved to Notion', message });
    },
    onError: (error) => {
      const message = error.message;
      showNotification({
        title: 'Failed saving doujin to notion',
        message,
        color: 'red',
      });
    },
  });

  return (
    <Layout>
      <Head>
        <title>nhentai</title>
      </Head>

      {isLoading && (
        <Center style={{ height: '100vh' }}>
          <Loader variant='bars' />
        </Center>
      )}
      {isSuccess && (
        <Grid gutter='xl' justify='center'>
          {/* Image */}
          <Grid.Col md='content'>
            <Center>
              <Stack>
                <Box
                  sx={{
                    '> span': {
                      display: 'block !important',
                      height: '100% !important',
                    },
                  }}
                >
                  <NextImage
                    src={doujin.images.cover}
                    width={215}
                    height={300}
                    style={{ borderRadius: theme.radius.sm }}
                  />
                </Box>
                {doujin.notion ? (
                  <NotionButton
                    type='link'
                    notionUrl={doujin.notion.url}
                    openIn='app'
                  />
                ) : (
                  <NotionButton
                    type='button'
                    onClick={() => mutate({ id })}
                    loading={isSaving}
                  />
                )}

                <SourceButton source={doujin.source} />
              </Stack>
            </Center>
          </Grid.Col>
          {/* Details */}
          <Grid.Col md='auto'>
            {/* Title / Header */}
            <Title mb='md'>{doujin.title.pretty}</Title>
            <Group>
              <Group spacing='xs'>
                <ThemeIcon color='red'>
                  <IconHash size={20} />
                </ThemeIcon>
                <Text inline weight={600} size='lg'>
                  {doujin.id}
                </Text>
              </Group>
            </Group>
            {/* More details */}
            <Stack mt='md'>
              {/* TOP */}
              <Title order={4}>Titles</Title>
              <Stack spacing='xs'>
                <Group spacing='xs'>
                  <ThemeIcon variant='light' color='red'>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>JP</span>
                  </ThemeIcon>
                  <Text size='sm'>{doujin.title.japanese}</Text>
                </Group>
                <Group spacing='xs'>
                  <ThemeIcon variant='light' color='blue'>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>EN</span>
                  </ThemeIcon>
                  <Text size='sm'>{doujin.title.english}</Text>
                </Group>
              </Stack>

              {/* BOTTOM */}
              <SectionStack title='Extras'>
                <SectionStack.Children title='Uploaded at'>
                  <Text inline>{`${dayjs(doujin.upload_date).format(
                    'll'
                  )} (${dayjs(doujin.upload_date).fromNow()})`}</Text>
                </SectionStack.Children>

                <Group spacing='xl'>
                  <SectionStack.Children title='Total pages'>
                    <Text inline>{doujin.num_pages}</Text>
                  </SectionStack.Children>
                  <SectionStack.Children title='Favorites'>
                    <Text inline>{doujin.num_favorites}</Text>
                  </SectionStack.Children>
                </Group>
              </SectionStack>

              <SectionStack title='Tags'>
                <Group spacing='xl'>
                  <SectionStack.Children title='Authors'>
                    <BadgeGroup tags={doujin.tags.artist} />
                  </SectionStack.Children>

                  <SectionStack.Children title='Categories'>
                    <BadgeGroup tags={doujin.tags.category} />
                  </SectionStack.Children>

                  <SectionStack.Children title='Parodies'>
                    <BadgeGroup tags={doujin.tags.parody} />
                  </SectionStack.Children>

                  <SectionStack.Children title='Characters'>
                    <BadgeGroup tags={doujin.tags.character} />
                  </SectionStack.Children>
                </Group>

                <SectionStack.Children title='Tags'>
                  <BadgeGroup tags={doujin.tags.tag} />
                </SectionStack.Children>
              </SectionStack>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Layout>
  );
}

const BadgeGroup = ({
  tags,
}: {
  tags: { id: string | number; name: string; url: string }[];
}) => {
  return (
    <Group spacing='xs'>
      {tags.length > 0 ? (
        tags.map((tag) => (
          <Badge
            key={tag.id}
            component='a'
            rel='noopener noreferrer'
            href={tag.url}
            target='_blank'
            variant='filled'
            color='gray'
            radius='sm'
          >
            {tag.name}
          </Badge>
        ))
      ) : (
        <Badge variant='outline' color='dark' radius='sm'>
          <Text span inline strikethrough>
            None
          </Text>
        </Badge>
      )}
    </Group>
  );
};
