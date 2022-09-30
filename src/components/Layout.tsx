import {
  Burger,
  Container,
  Group,
  Header as MantineHeader,
  MediaQuery,
  NavLink,
  Paper,
  Transition,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { NextLink } from '@mantine/next';
import { IconBooks, IconMovie, IconWoman } from '@tabler/icons';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Header />
      <main>
        <Container py='lg'>{children}</Container>
      </main>
      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}

const LINKS = [
  {
    icon: IconMovie,
    link: '/hanime',
    label: 'hanime.tv',
    description: 'Search for hanime',
  },
  {
    icon: IconBooks,
    link: '/nhentai',
    label: 'nhentai.net',
    description: 'Search for doujin',
  },
  {
    icon: IconWoman,
    link: '/jav-actress',
    label: 'jav-actress',
    description: 'Search for jav actress',
  },
];

function Header() {
  const [opened, { toggle }] = useDisclosure(false);
  const router = useRouter();

  const items = LINKS.map(({ icon: Icon, link, label, description }) => (
    <NavLink
      component={NextLink}
      key={label}
      label={label}
      description={description}
      href={link}
      noWrap
      icon={<Icon size={20} />}
      active={router.pathname.includes(link)}
    />
  ));

  return (
    <MantineHeader height={60} sx={{ position: 'relative', zIndex: 1 }}>
      <Container
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <MediaQuery smallerThan='sm' styles={{ display: 'none' }}>
          <Group noWrap spacing={5}>
            {items}
          </Group>
        </MediaQuery>

        <MediaQuery largerThan='sm' styles={{ display: 'none' }}>
          <Burger opened={opened} onClick={toggle} size='sm' />
        </MediaQuery>

        <Transition transition='fade' duration={200} mounted={opened}>
          {(styles) => (
            <Paper
              withBorder
              sx={(theme) => ({
                position: 'absolute',
                top: 60,
                left: 0,
                right: 0,
                zIndex: 0,
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
                borderTopWidth: 0,
                overflow: 'hidden',

                [theme.fn.largerThan('sm')]: {
                  display: 'none',
                },
              })}
              style={styles}
            >
              {items}
            </Paper>
          )}
        </Transition>
      </Container>
    </MantineHeader>
  );
}
