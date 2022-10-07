import {
  Center,
  Grid,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconHash } from '@tabler/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BadgeGroup } from '../../components/BadgeGroup';
import Layout from '../../components/Layout';
import { NotionButton } from '../../components/NotionButton';
import { SectionStack } from '../../components/SectionStack';
import { SourceButton } from '../../components/SourceButton';
import { trpc } from '../../utils/trpc';

export default function HanimeDetailPage() {
  const trpcContext = trpc.useContext();
  const query = useRouter().query;
  const id = query.id as string;

  const {
    data: hentai,
    isLoading,
    isSuccess,
  } = trpc.useQuery(['hanime.get', { id }], { enabled: !!id });
  const { mutate, isLoading: isSaving } = trpc.useMutation(['hanime.save'], {
    onSuccess: ({ notion }) => {
      trpcContext.invalidateQueries(['hanime.get', { id }]);

      const message = `Hanime saved to Notion! ${notion.url}`;
      showNotification({ title: 'Saved to Notion', message });
    },
    onError: (error) => {
      const message = error.message;
      showNotification({
        title: `Failed saving hanime: ${id} to notion`,
        message,
        color: 'red',
      });
    },
  });

  return (
    <Layout>
      <Head>
        <title>Hanime</title>
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
                <Image
                  src={hentai.cover_url}
                  alt={hentai.name}
                  radius='md'
                  width={215}
                />

                {hentai.notion ? (
                  <NotionButton
                    type='link'
                    notionUrl={hentai.notion.url}
                    openIn='app'
                  />
                ) : (
                  <NotionButton
                    type='button'
                    onClick={() => mutate({ id })}
                    loading={isSaving}
                  />
                )}

                <SourceButton source={hentai.source} />
              </Stack>
            </Center>
          </Grid.Col>
          <Grid.Col md='auto'>
            {/* Title / Header */}
            <Title mb='md'>{hentai.name}</Title>
            <Group>
              <Group spacing='xs'>
                <ThemeIcon color='red'>
                  <IconHash size={20} />
                </ThemeIcon>
                <Text inline weight={600} size='lg'>
                  {hentai.id}
                </Text>
              </Group>
            </Group>

            <Stack mt='md'>
              <SectionStack.Children title='Brand'>
                <Text inline>{hentai.brand.title}</Text>
              </SectionStack.Children>
              <SectionStack.Children title='Tags'>
                <BadgeGroup
                  badges={hentai.tags.map(({ id, text }) => ({
                    id,
                    name: text,
                  }))}
                />
              </SectionStack.Children>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Layout>
  );
}
