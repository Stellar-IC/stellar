import { Card, Checkbox, Container, Stack, Text, Title } from '@mantine/core';

import { PageWrapper } from '@/PageWrapper';
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
      ],
      requires: 'application.developerSettingsEnabled',
    },
  ],
};

export function SettingsPage() {
  const { getSettingValue, updateSettings } = useSettingsContext();

  return (
    <PageWrapper>
      <Container>
        <Stack>
          <Title size="h1" tt="uppercase">
            Settings
          </Title>
          <form>
            <Stack>
              {settingsConfig.groups.map((group) => {
                if (group.requires) {
                  const requiredSetting = getSettingValue(group.requires);
                  if (!requiredSetting) return null;
                }

                return (
                  <Card key={group.key}>
                    <Text size="xl" mb="md">
                      {group.name}
                    </Text>
                    <Stack>
                      {group.items.map((item) => {
                        const path = [group.key, item.key].join('.');
                        const setting = getSettingValue(path);

                        return (
                          <Checkbox
                            key={item.key}
                            label={item.name}
                            description={item.description}
                            checked={setting === true}
                            onChange={(event) => {
                              updateSettings(path, event.currentTarget.checked);
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </form>
        </Stack>
      </Container>
    </PageWrapper>
  );
}
