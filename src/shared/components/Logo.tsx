import { useState } from 'react';
import { CONNECTOR_FALLBACK_LOGO_URL } from '../constants';

interface LogoProps {
    src?: string;
    alt: string;
    fallbackUrl?: string;
    style?: React.CSSProperties;
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({
    src,
    alt,
    fallbackUrl = CONNECTOR_FALLBACK_LOGO_URL,
    style,
    className,
}) => {
    // Remember which src failed rather than a flag, so a new src is tried instead of staying on the fallback.
    const [failedSrc, setFailedSrc] = useState<string>();
    const imageSrc = src && src !== failedSrc ? src : fallbackUrl;

    return (
        <img
            src={imageSrc}
            alt={alt}
            style={style}
            className={className}
            onError={() => setFailedSrc(src)}
        />
    );
};
