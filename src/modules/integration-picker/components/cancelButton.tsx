import { Button, CustomIcons } from '@stackone/malachite';

const { CloseIcon } = CustomIcons;

/** The X in the hub's header for leaving before a link succeeds; the same ghost square as Back. */
export const CancelButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <Button
        variant="ghost"
        size="small"
        iconOnly
        icon={<CloseIcon size={12} />}
        aria-label="Close"
        onClick={onClick}
    />
);
