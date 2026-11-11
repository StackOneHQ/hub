import { Dropdown } from '@stackone/malachite';
import { ConnectorProfile } from '../types';
import { profileOptions } from '../utils/profileOptions';

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
    const items = profileOptions(profiles);
    if (items.length === 0) {
        return null;
    }

    return (
        <div style={PICKER_STYLE}>
            <Dropdown
                name="connector-profile"
                label="Connection profile"
                required
                size="large"
                fullWidth
                subtitleLayout="stacked"
                showSubtitleInTrigger
                items={items}
                value={selectedProfileId}
                onItemSelected={(id) => id && onProfileChange(id)}
            />
        </div>
    );
};
