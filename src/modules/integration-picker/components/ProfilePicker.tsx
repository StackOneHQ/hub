import { Dropdown } from '@stackone/malachite';
import { useCallback, useMemo } from 'react';
import { ConnectorProfile } from '../types';
import { profileOptions } from '../utils/profileOptions';

// Padded applies one value to top and bottom; the picker needs the form's large top gutter and no bottom.
const PICKER_STYLE: React.CSSProperties = { padding: '28px 14px 0' };

interface ProfilePickerProps {
    profiles?: ConnectorProfile[];
    selectedProfileId?: string;
    onProfileChange: (integrationId: string) => void;
}

export const ProfilePicker: React.FC<ProfilePickerProps> = ({
    profiles,
    selectedProfileId,
    onProfileChange,
}) => {
    const items = useMemo(() => profileOptions(profiles), [profiles]);
    const selectProfile = useCallback(
        (id?: string) => id && onProfileChange(id),
        [onProfileChange],
    );

    if (!items.some((item) => item.id === selectedProfileId)) {
        return null;
    }

    return (
        <div style={PICKER_STYLE}>
            <Dropdown
                name="connector-profile"
                label="Connection profile"
                requiredIndicator="none"
                size="large"
                fullWidth
                subtitleLayout="stacked"
                showSubtitleInTrigger
                items={items}
                value={selectedProfileId}
                onItemSelected={selectProfile}
            />
        </div>
    );
};
