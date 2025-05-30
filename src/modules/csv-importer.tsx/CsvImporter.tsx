import {
    Card,
    Flex,
    FlexDirection,
    FlexGapSize,
    FooterLinks,
    Typography,
} from '@stackone/malachite';

interface CsvImporterProps {
    height?: string;
}

export const CsvImporter: React.FC<CsvImporterProps> = ({ height = '400px' }) => {
    return (
        <Card
            title={
                <Typography.Text fontWeight="semi-bold" size="large">
                    CSV Importer
                </Typography.Text>
            }
            footer={<FooterLinks />}
            height={height}
        >
            <Flex direction={FlexDirection.Vertical} gapSize={FlexGapSize.Small} fullHeight>
                <Typography.Text fontWeight="bold" size="large">
                    CSV Importer
                </Typography.Text>
                <Typography.SecondaryText>
                    This is the CSV importer module.
                </Typography.SecondaryText>
            </Flex>
        </Card>
    );
};
