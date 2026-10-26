import { CloseButton } from '@stackone/malachite';

/**
 * The close in the hub's header for leaving before a link succeeds: malachite's own bare X,
 * the one the dashboard's wizards dismiss with, so it reads the same inside and outside the hub.
 */
export const CancelButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <CloseButton size="small" onClick={onClick} />
);
