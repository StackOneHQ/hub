import {
    Button,
    Flex,
    FlexDirection,
    FlexJustify,
    FooterLinks,
    Padded,
    Spacer,
} from '@stackone/malachite';
import { useMemo } from 'react';
import { Integration } from '../types';

interface CardFooterProps {
    selectedIntegration: Integration | null;
    fullWidth?: boolean;
    showActions?: boolean;
    onBack?: () => void;
    onNext: () => void;
    isFormValid?: boolean;
    showFooterLinks?: boolean;
}

const CardFooter: React.FC<CardFooterProps> = ({
    fullWidth = true,
    selectedIntegration,
    showActions,
    onBack,
    onNext,
    isFormValid = true,
    showFooterLinks = true,
}) => {
    const buttons = useMemo(() => {
        if (!selectedIntegration || !showActions) {
            return [];
        }

        const buttons: Array<{
            label: string;
            type: 'outline' | 'filled';
            onClick: () => void;
            disabled: boolean;
            loading: boolean;
        }> = [];

        if (onBack) {
            buttons.push({
                label: 'Back',
                type: 'outline' as const,
                onClick: onBack,
                disabled: false,
                loading: false,
            });
        }

        buttons.push({
            label: 'Connect',
            type: 'filled' as const,
            onClick: onNext,
            disabled: !isFormValid,
            loading: false,
        });

        return buttons;
    }, [selectedIntegration, onBack, onNext, showActions, isFormValid]);

    if (buttons.length === 0) {
        if (!showFooterLinks) {
            return null;
        }
        return <FooterLinks fullWidth={fullWidth} />;
    }

    return (
        <Spacer direction="horizontal" size={4} justifyContent="space-between">
            {showFooterLinks && <FooterLinks fullWidth={fullWidth} />}
            <Padded vertical="none" horizontal="small" fullHeight={false}>
                <Flex direction={FlexDirection.Horizontal} justify={FlexJustify.Right}>
                    <Spacer direction="horizontal" size={10}>
                        {buttons.map((button) => (
                            <Button
                                key={button.label}
                                size="small"
                                variant={button.type}
                                onClick={button.onClick}
                                disabled={button.disabled}
                                loading={button.loading}
                                iconPosition="end"
                            >
                                {button.label}
                            </Button>
                        ))}
                    </Spacer>
                </Flex>
            </Padded>
        </Spacer>
    );
};

export default CardFooter;
