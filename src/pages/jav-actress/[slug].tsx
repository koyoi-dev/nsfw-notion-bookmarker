import {
  Center,
  Grid,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BadgeGroup } from '../../components/BadgeGroup';
import Layout from '../../components/Layout';
import { NotionButton } from '../../components/NotionButton';
import { SectionStack } from '../../components/SectionStack';
import { SourceButton } from '../../components/SourceButton';
import dayjs from '../../utils/dayjs';
import { trpc } from '../../utils/trpc';

export default function JavActressPage() {
  const trpcContext = trpc.useContext();
  const router = useRouter();
  const slug = router.query.slug as string;

  const {
    data: actress,
    isLoading: isActressLoading,
    isSuccess: isActressSuccess,
  } = trpc.useQuery(['jav-actress.get', { slug }], {
    enabled: !!slug,
  });

  const { mutate, isLoading: isSaving } = trpc.useMutation(
    ['jav-actress.save'],
    {
      onSuccess: ({ notion }) => {
        trpcContext.invalidateQueries(['jav-actress.get', { slug }]);

        const message = `Actress saved to Notion! ${notion.url}`;
        showNotification({ title: 'Saved to Notion', message });
      },
      onError: (error) => {
        const message = error.message;
        showNotification({
          title: `Failed saving actress: ${slug} to notion`,
          message,
          color: 'red',
        });
      },
    }
  );

  return (
    <Layout>
      <Head>
        <title>JAV Actress</title>
      </Head>

      {isActressLoading && (
        <Center style={{ height: '100vh' }}>
          <Loader variant='bars' />
        </Center>
      )}
      {isActressSuccess && (
        <Grid gutter='xl' justify='center'>
          {/* Image */}
          <Grid.Col md='content'>
            <Center>
              <Stack>
                <Image
                  src={actress.thumbnail || undefined}
                  alt={actress.name}
                  radius='md'
                  width={215}
                />
                {actress.notion ? (
                  <NotionButton
                    type='link'
                    notionUrl={actress.notion.url}
                    openIn='app'
                  />
                ) : (
                  <NotionButton
                    type='button'
                    onClick={() => mutate({ slug })}
                    loading={isSaving}
                  />
                )}

                <SourceButton source={actress.source || '#'} />
              </Stack>
            </Center>
          </Grid.Col>
          <Grid.Col md='auto'>
            {/* Title / Header */}
            <Title mb='md'>
              {actress.name}{' '}
              <Text span inline color='dimmed'>
                ({actress.japanese})
              </Text>
            </Title>
            {/* More details */}
            <Stack mt='md'>
              {/* TOP */}
              <SectionStack title='Personal Info'>
                <Group spacing='lg'>
                  <SectionStack.Children title='Height'>
                    <Text inline>{actress.height}</Text>
                  </SectionStack.Children>

                  <SectionStack.Children title='Bust'>
                    <Text inline>{actress.bust}</Text>
                  </SectionStack.Children>

                  <SectionStack.Children title='Waist'>
                    <Text inline>{actress.waist}</Text>
                  </SectionStack.Children>
                  <SectionStack.Children title='Hip'>
                    <Text inline>{actress.hip}</Text>
                  </SectionStack.Children>
                </Group>

                <Group spacing='lg'>
                  <SectionStack.Children title='Birthdate'>
                    <Text inline>
                      {actress.birthdate
                        ? dayjs(actress.birthdate).format('LL')
                        : '-'}
                    </Text>
                  </SectionStack.Children>
                  <SectionStack.Children title='Blood Type'>
                    <Text inline>{actress.blood_type}</Text>
                  </SectionStack.Children>
                </Group>
              </SectionStack>

              <SectionStack title='Extra Info'>
                <SectionStack.Children title='Categories (javlink)'>
                  <BadgeGroup
                    badges={(actress.categories || []).map((category, i) => ({
                      id: i,
                      name: category,
                    }))}
                  />
                </SectionStack.Children>
              </SectionStack>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Layout>
  );
}
