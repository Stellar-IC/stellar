import { Box, Card, Checkbox, Stack, Text } from '@mantine/core';
import { useSettingsContext } from '@/contexts/SettingsContext';

enum SettingsValueType {
  Boolean = 'Boolean',
}

const settingsConfig = {
  groups: [
    {
      name: 'Application Settings',
      key: 'application',
      items: [
        {
          key: 'developerSettingsEnabled',
          name: 'Enable Developer Settings',
          description: 'Enable developer settings',
          valueType: SettingsValueType.Boolean,
        },
      ],
    },
    {
      name: 'Developer Settings',
      key: 'developer',
      items: [
        {
          key: 'showBlockIds',
          name: 'Show block ids',
          description:
            'Enabling this setting will show the unique ids for each block in the editor.',
          valueType: SettingsValueType.Boolean,
        },
        {
          key: 'showDeletedBlocks',
          name: 'Show deleted blocks',
          description:
            'Enabling this setting will show deleted blocks in the editor.',
          valueType: SettingsValueType.Boolean,
        },
      ],
    },
  ],
};

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsContext();

  console.log(settings);

  return (
    <Box style={{ width: '100%' }} p="lg">
      <Stack>
        <Text size="xl">Settings</Text>
        <form>
          <Stack>
            {settingsConfig.groups.map((group) => (
              <Card key={group.key}>
                <Text size="xl" mb="md">
                  {group.name}
                </Text>
                <Stack>
                  {group.items.map((item) => {
                    const key = [group.key, item.key].join('.');
                    const setting = settings.find((s) => s.path === key);
                    console.log({ setting });
                    //   if (!setting) return null;

                    return (
                      <Checkbox
                        key={item.key}
                        label={item.name}
                        description={item.description}
                        checked={setting?.value}
                        onChange={(event) => {
                          updateSettings(key, event.currentTarget.checked);
                        }}
                      />
                    );
                  })}
                </Stack>
              </Card>
            ))}
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
