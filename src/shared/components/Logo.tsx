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
    const [imageSrc, setImageSrc] = useState(src);

    const handleImageError = () => {
        setImageSrc(fallbackUrl);
    };

    return (
        <img
            src={imageSrc}
            alt={alt}
            style={style}
            className={className}
            onError={handleImageError}
        />
    );
};
