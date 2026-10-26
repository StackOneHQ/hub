import { CloseButton } from '@stackone/malachite';

interface HeaderCloseButtonProps {
    onClick: () => void;
    /** For a header with no padding of its own: the inset the connector form's header has. */
    standalone?: boolean;
}

export const HeaderCloseButton: React.FC<HeaderCloseButtonProps> = ({ onClick, standalone }) => {
    const button = <CloseButton size="small" onClick={onClick} />;

    return standalone ? <div style={{ padding: '8px 12px 8px 8px' }}>{button}</div> : button;
};
