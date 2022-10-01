import { Button } from '@mantine/core';
import { IconBrandNotion, IconExternalLink } from '@tabler/icons';

type NotionButtonProps =
  | {
      type: 'link';
      notionUrl: string;
      openIn: 'app' | 'browser';
    }
  | {
      type: 'button';
      onClick: () => void;
      loading?: boolean;
      disabled?: boolean;
    };

export const NotionButton = (props: NotionButtonProps) => {
  if (props.type === 'link') {
    return (
      <Button
        component='a'
        rel='noopener noreferrer'
        href={
          props.openIn === 'app'
            ? props.notionUrl.replace('https', 'notion')
            : props.notionUrl
        }
        variant='white'
        target='_blank'
        color='dark'
        leftIcon={<IconExternalLink size={20} />}
      >
        {props.openIn === 'app' ? 'Open in Notion' : 'Open in Browser'}
      </Button>
    );
  }

  return (
    <Button
      leftIcon={<IconBrandNotion size={20} />}
      variant='white'
      color='dark'
      loaderProps={{
        color: 'blue',
      }}
      loading={props.loading}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.loading ? 'Saving...' : props.disabled ? 'Saved' : 'Save'}
    </Button>
  );
};
