import { CloseButton } from '@stackone/malachite';

export const HeaderCloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <CloseButton size="small" onClick={onClick} />
);
