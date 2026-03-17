import {
    Button,
    Flex,
    FlexDirection,
    FlexJustify,
    FooterLinks,
    Padded,
    Spacer,
} from '@stackone/malachite';

interface CardFooterProps {
    onClose?: () => void;
    showFooterLinks?: boolean;
}

const SuccessCardFooter: React.FC<CardFooterProps> = ({ showFooterLinks = true, onClose }) => {
    const hasFooterLinks = showFooterLinks;
    const hasClose = Boolean(onClose);

    if (!hasFooterLinks && !hasClose) {
        return null;
    }

    return (
        <Spacer
            direction="horizontal"
            size={4}
            justifyContent={
                hasFooterLinks && hasClose ? 'space-between' : hasClose ? 'end' : undefined
            }
        >
            {hasFooterLinks && <FooterLinks fullWidth />}
            {hasClose && (
                <Padded vertical="none" horizontal="small" fullHeight={false}>
                    <Flex direction={FlexDirection.Horizontal} justify={FlexJustify.Right}>
                        <Spacer direction="horizontal" size={10}>
                            <Button size="small" variant="filled" onClick={onClose}>
                                Close
                            </Button>
                        </Spacer>
                    </Flex>
                </Padded>
            )}
        </Spacer>
    );
};

export default SuccessCardFooter;
