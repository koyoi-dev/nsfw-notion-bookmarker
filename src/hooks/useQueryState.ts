import { useDebouncedState } from '@mantine/hooks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const useQuerySearch = (initialValue = '') => {
  const router = useRouter();
  const query = router.query;
  const search = query.search as string;

  const [value, setValue] = useDebouncedState(search ?? initialValue, 1000);

  useEffect(() => {
    if (value !== search) {
      router.push({
        pathname: router.pathname,
        query: {
          ...query,
          search: value,
        },
      });
    }
  }, [value]);

  return [value, setValue] as const;
};
