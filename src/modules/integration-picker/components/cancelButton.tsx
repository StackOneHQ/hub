import { Button, DismissIcon } from '@stackone/malachite';

/**
 * The X in the hub's header for leaving before a link succeeds: the same ghost square as Back,
 * drawn with the glyph malachite's own CloseButton uses, so it matches the host around it.
 */
export const CancelButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <Button
        variant="ghost"
        size="small"
        iconOnly
        icon={<DismissIcon size={14} />}
        aria-label="Close"
        onClick={onClick}
    />
);
