import { TextInput, TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons';

type SearchBoxProps = TextInputProps;
export const SearchBox = ({ ...props }: SearchBoxProps) => {
  return (
    <TextInput
      placeholder='Search'
      icon={<IconSearch size={16} stroke={1.5} />}
      autoComplete='off'
      {...props}
    />
  );
};
