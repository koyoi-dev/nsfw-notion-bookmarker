import { Badge, Group, Text } from '@mantine/core';

type Badge = {
  id: string | number;
  name: string;
};

type BadgeGroupProps = {
  badges: Badge[];
};

export const BadgeGroup = ({ badges }: BadgeGroupProps) => {
  return (
    <Group spacing='xs'>
      {badges.length > 0 ? (
        badges.map((badge) => (
          <Badge key={badge.id} variant='filled' color='gray' radius='sm'>
            {badge.name}
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
