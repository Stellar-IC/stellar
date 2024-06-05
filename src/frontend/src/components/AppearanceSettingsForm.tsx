import {
  MantineColorScheme,
  Select,
  Stack,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCallback } from 'react';

export type AppearanceSettingsFormFormValues = {
  colorScheme: MantineColorScheme;
};

const stringToColorScheme = (val: string) => {
  if (val === 'light' || val === 'dark' || val === 'auto') {
    return val as MantineColorScheme;
  }

  throw new Error('Invalid color scheme');
};

export const AppearanceSettingsForm = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const form = useForm({
    initialValues: { colorScheme },
    validate: {
      colorScheme: (value) => {
        if (!value || !['light', 'dark', 'auto'].includes(value)) {
          return 'Invalid color scheme';
        }
        return null;
      },
    },
  });

  const onColorSchemeChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      const colorScheme = stringToColorScheme(value);
      form.getInputProps('colorScheme').onChange(value);
      setColorScheme(colorScheme);
    },
    [form, setColorScheme]
  );

  return (
    <form>
      <Stack>
        <Select
          label="Color scheme"
          name="colorScheme"
          w="100%"
          {...form.getInputProps('colorScheme')}
          onChange={onColorSchemeChange}
          data={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
      </Stack>
    </form>
  );
};
