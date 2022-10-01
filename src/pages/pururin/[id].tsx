import {
  Center,
  Grid,
  Loader,
  Stack,
  Title,
  Image,
  Group,
  ThemeIcon,
  Text,
  Button,
  ActionIcon,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconExternalLink, IconHash } from '@tabler/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BadgeGroup } from '../../components/BadgeGroup';
import Layout from '../../components/Layout';
import { NotionButton } from '../../components/NotionButton';
import { SectionStack } from '../../components/SectionStack';
import { SourceButton } from '../../components/SourceButton';
import { trpc } from '../../utils/trpc';

export default function PururinDetailPage() {
  const trpcContext = trpc.useContext();
  const router = useRouter();
  const id = router.query.id as string;

  const {
    data: doujin,
    isLoading,
    isSuccess,
  } = trpc.useQuery(['pururin.get', { id }], { enabled: !!id });
  const { mutate, isLoading: isSaving } = trpc.useMutation(['pururin.save'], {
    onSuccess: ({ notion }) => {
      trpcContext.invalidateQueries(['pururin.get', { id }]);

      const message = `Doujin saved to Notion! ${notion.url}`;
      showNotification({ title: 'Saved to Notion', message });
    },
    onError: (error) => {
      const message = error.message;
      showNotification({
        title: `Failed saving doujin: ${id} to notion`,
        message,
        color: 'red',
      });
    },
  });
  return (
    <Layout>
      <Head>
        <title>Pururin</title>
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
                  src={doujin.image_url}
                  alt={doujin.title}
                  radius='md'
                  width={215}
                />

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
          <Grid.Col md='auto'>
            {/* Title / Header */}
            <Title mb='md'>{doujin.title}</Title>
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
              <SectionStack title='Alternative Titles'>
                <Group spacing='xs'>
                  <ThemeIcon variant='light' color='red'>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>JP</span>
                  </ThemeIcon>
                  <Text size='sm'>{doujin.j_title ?? '-'}</Text>
                </Group>
                <Group spacing='xs'>
                  <ThemeIcon variant='light' color='blue'>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>EN</span>
                  </ThemeIcon>
                  <Text size='sm'>{doujin.alt_title ?? '-'}</Text>
                </Group>
              </SectionStack>

              <SectionStack title='Extras'>
                <Group spacing='xl'>
                  <SectionStack.Children title='Total pages'>
                    <Text inline>{doujin.total_pages}</Text>
                  </SectionStack.Children>
                  <SectionStack.Children title='Slug'>
                    <Text inline>{doujin.slug}</Text>
                  </SectionStack.Children>
                </Group>
              </SectionStack>

              <SectionStack title='Tags'>
                <Group spacing='xl'>
                  <SectionStack.Children title='Authors'>
                    <BadgeGroup badges={doujin.tags.Artist} />
                  </SectionStack.Children>

                  <SectionStack.Children title='Categories'>
                    <BadgeGroup badges={doujin.tags.Category} />
                  </SectionStack.Children>

                  <SectionStack.Children title='Parodies'>
                    <BadgeGroup badges={doujin.tags.Parody} />
                  </SectionStack.Children>

                  <SectionStack.Children title='Characters'>
                    <BadgeGroup badges={doujin.tags.Character} />
                  </SectionStack.Children>
                </Group>

                <SectionStack.Children title='Tags'>
                  <BadgeGroup badges={doujin.tags.Contents} />
                </SectionStack.Children>
              </SectionStack>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Layout>
  );
}
