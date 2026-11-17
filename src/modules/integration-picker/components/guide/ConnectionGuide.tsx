import {
    Alert,
    Button,
    CaretLeftIcon,
    CaretRightIcon,
    Stepper,
    Surface,
    Typography,
    ZoomableImage,
} from '@stackone/malachite';
import React, { useEffect, useMemo, useState } from 'react';
import { Guide } from '../../types';
import { guideImageUrl } from '../../utils/guideImageUrl';
import { GuideLayout } from '../../utils/guideLayout';
import { guidePages, guideSections } from '../../utils/guidePages';

interface ConnectionGuideProps {
    connectorKey: string;
    guide: Guide;
    layout: GuideLayout;
    page: number;
    onPageChange: (page: number) => void;
}

const PANE_DIVIDER = '1px solid var(--malachite-card-border)';

const columnStyle = (layout: GuideLayout): React.CSSProperties =>
    layout === 'beside'
        ? {
              display: 'flex',
              flexDirection: 'column',
              flex: '1.2 1 0',
              height: '100%',
              minWidth: 0,
              borderRight: PANE_DIVIDER,
          }
        : {
              display: 'flex',
              flexDirection: 'column',
              flex: '0 1 auto',
              minHeight: 0,
              maxHeight: '55%',
              borderBottom: PANE_DIVIDER,
          };

const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
};
const stepperStyle: React.CSSProperties = { flex: '0 1 200px', minWidth: 120 };
const bodyStyle: React.CSSProperties = {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 16px 12px',
};
const bodyContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};
const sectionBoxStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '12px 14px',
};
const stepStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const proseStyle: React.CSSProperties = { lineHeight: 1.75 };
const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderTop: PANE_DIVIDER,
};

/** The step's text with its list, if any, as one Markdown block so the list takes malachite's own styling. */
const stepMarkdown = (content: string, list: ReadonlyArray<string> | undefined): string =>
    [content, (list ?? []).map((item) => `- ${item}`).join('\n')]
        .filter((part) => part !== '')
        .join('\n\n');

export const ConnectionGuide: React.FC<ConnectionGuideProps> = ({
    connectorKey,
    guide,
    layout,
    page: requestedPage,
    onPageChange,
}) => {
    const pages = useMemo(() => guidePages(guide), [guide]);
    const sections = useMemo(() => guideSections(guide), [guide]);
    // Held by URL, so one failed screenshot never hides the screenshot of a later page.
    const [failedScreenshots, setFailedScreenshots] = useState<ReadonlySet<string>>(new Set());

    const pageIndex = Math.min(requestedPage, Math.max(pages.length - 1, 0));
    const page = pages[pageIndex];
    const nextImage = pages[pageIndex + 1]?.image;
    const nextScreenshotUrl = nextImage ? guideImageUrl(connectorKey, nextImage.src) : undefined;

    useEffect(() => {
        if (nextScreenshotUrl) {
            new Image().src = nextScreenshotUrl;
        }
    }, [nextScreenshotUrl]);

    // An empty guide leaves the form exactly as it was rather than opening a region with a
    // heading and nothing under it.
    if (!page) {
        return null;
    }

    const screenshotUrl = page.image ? guideImageUrl(connectorKey, page.image.src) : undefined;
    const showsScreenshot = screenshotUrl !== undefined && !failedScreenshots.has(screenshotUrl);
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === pages.length - 1;
    const body = stepMarkdown(page.content, page.list);

    return (
        <div style={columnStyle(layout)}>
            <div style={headerStyle}>
                <Typography.Text size="small" fontWeight="semi-bold" color="secondary">
                    Connection guide
                </Typography.Text>
                {pages.length > 1 ? (
                    <div style={stepperStyle}>
                        <Stepper
                            groups={sections}
                            active={pageIndex}
                            onChange={onPageChange}
                            aria-label="Setup steps"
                        />
                    </div>
                ) : null}
            </div>
            <div style={bodyStyle}>
                <div style={bodyContentStyle}>
                    <Surface
                        tone="highlight"
                        role="region"
                        aria-label={page.sectionTitle}
                        style={sectionBoxStyle}
                    >
                        <Typography.Text as="h2" size="large" font="heading">
                            {page.sectionTitle}
                        </Typography.Text>
                        {page.sectionIntro ? (
                            <div style={proseStyle}>
                                <Typography.MarkdownBlock
                                    text={page.sectionIntro}
                                    size="small"
                                    color="secondary"
                                    omitMargin
                                />
                            </div>
                        ) : null}
                    </Surface>
                    {isFirst && guide.warning ? (
                        <Alert type="warning" hasMargin={false} message={guide.warning} />
                    ) : null}
                    <div style={stepStyle}>
                        {page.isWholeSection ? null : (
                            <Typography.Text as="h3" size="medium" fontWeight="semi-bold">
                                {page.title}
                            </Typography.Text>
                        )}
                        {body ? (
                            <div style={proseStyle}>
                                <Typography.MarkdownBlock text={body} size="small" />
                            </div>
                        ) : null}
                        {showsScreenshot && page.image ? (
                            <ZoomableImage
                                src={screenshotUrl}
                                alt={page.image.alt}
                                title={page.title}
                                onError={() =>
                                    setFailedScreenshots(
                                        (failed) => new Set([...failed, screenshotUrl]),
                                    )
                                }
                            />
                        ) : null}
                    </div>
                </div>
            </div>
            {pages.length > 1 ? (
                <div style={footerStyle}>
                    <Button
                        variant="outline"
                        size="small"
                        iconOnly
                        icon={<CaretLeftIcon />}
                        aria-label="Previous step"
                        disabled={isFirst}
                        onClick={() => onPageChange(pageIndex - 1)}
                    />
                    <Button
                        variant="outline"
                        size="small"
                        iconOnly
                        icon={<CaretRightIcon />}
                        aria-label="Next step"
                        disabled={isLast}
                        onClick={() => onPageChange(pageIndex + 1)}
                    />
                </div>
            ) : null}
        </div>
    );
};
