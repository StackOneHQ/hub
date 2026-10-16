import { DropdownItem, Tag } from '@stackone/malachite';
import { ConnectorProfile } from '../types';

export function profileOptions(profiles: ConnectorProfile[] | null | undefined): DropdownItem[] {
    if (!profiles || profiles.length < 2) {
        return [];
    }

    return profiles.map((profile) => ({
        id: profile.integration_id,
        label: profile.profile_name || profile.name,
        subtitle: profile.is_default ? 'Default' : undefined,
        badge: profile.authentication_config_label ? (
            <Tag type="default" fontSize="xsmall" value={profile.authentication_config_label} />
        ) : undefined,
    }));
}
