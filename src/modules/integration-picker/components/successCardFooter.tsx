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
    onClose: () => void;
    showFooterLinks?: boolean;
}

const SuccessCardFooter: React.FC<CardFooterProps> = ({ showFooterLinks = true, onClose }) => {
    return (
        <Spacer direction="horizontal" size={4} justifyContent="space-between">
            {showFooterLinks && <FooterLinks fullWidth />}
            <Padded vertical="none" horizontal="small" fullHeight={false}>
                <Flex direction={FlexDirection.Horizontal} justify={FlexJustify.Right}>
                    <Spacer direction="horizontal" size={10}>
                        <Button size="small" variant="filled" onClick={onClose}>
                            Close
                        </Button>
                    </Spacer>
                </Flex>
            </Padded>
        </Spacer>
    );
};

export default SuccessCardFooter;
