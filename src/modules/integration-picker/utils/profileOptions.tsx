import { DropdownItem, Tag } from '@stackone/malachite';
import { ConnectorProfile } from '../types';

export function profileOptions(profiles: ConnectorProfile[] | null | undefined): DropdownItem[] {
    if (!profiles || profiles.length < 2) {
        return [];
    }

    return profiles.map((profile) => ({
        id: profile.integration_id,
        label: profile.profile_name || profile.name,
        subtitle: profile.authentication_config_label ?? undefined,
        badge: profile.is_default ? (
            <Tag type="default" fontSize="xsmall" textTransform="none" value="Default" />
        ) : undefined,
        badgePlacement: 'label',
        triggerTag: profile.is_default ? 'Default' : undefined,
    }));
}
