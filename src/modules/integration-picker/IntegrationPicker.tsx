import { Alert, Card } from '@stackone/malachite';
import { useCallback, useMemo, useState } from 'react';
import useFeatureFlags from '../../shared/hooks/useFeatureFlags';
import { useMeasuredWidth } from '../../shared/hooks/useMeasuredWidth';
import {
    IntegrationPickerContent,
    showsIntegrationForm,
} from './components/IntegrationPickerContent';
import { IntegrationPickerTitle } from './components/IntegrationPickerTitle';
import CardFooter from './components/cardFooter';
import { ConnectionGuide } from './components/guide/ConnectionGuide';
import SuccessCardFooter from './components/successCardFooter';
import { useGuideReader } from './hooks/useGuideReader';
import { useIntegrationPicker } from './hooks/useIntegrationPicker';
import { guideLayout } from './utils/guideLayout';
import { guidePages } from './utils/guidePages';
import { CONNECTION_GUIDE_FLAG, headerGuideLink, inlineGuide } from './utils/inlineGuide';

interface IntegrationPickerProps {
    token: string;
    baseUrl: string;
    height: string;
    accountId?: string;
    dashboardUrl?: string;
    onSuccess?: (account: { id: string; provider: string }) => void;
    onClose?: () => void;
    showFooterLinks?: boolean;
    onCloseLabel?: string;
    closable?: boolean;
    debug?: boolean;
}

const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
};

// The outer card owns the border, radius and shadow; the inner one only fills what the guide leaves.
const fillingCardStyle: React.CSSProperties = {
    flex: '1 1 0',
    minWidth: 0,
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
};

export const IntegrationPicker: React.FC<IntegrationPickerProps> = ({
    token,
    baseUrl,
    height,
    accountId,
    onSuccess,
    onClose,
    dashboardUrl,
    showFooterLinks = true,
    onCloseLabel,
    closable,
    debug,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');

    const {
        // Data
        hubData,
        accountData,
        connectorData,
        selectedIntegration,
        profiles,
        fields,
        notices,
        guide,
        connectionGuide,

        // State
        connectionState,
        isLoading,
        hasError,
        isFormValid,

        // Errors
        errorHubData,
        errorConnectorData,

        // Actions
        setSelectedIntegration,
        selectProfile,
        setFormData,
        setIsFormValid,
        handleConnect,
        handleCancelOAuth,
        resetConnectionState,
        editingSecrets,
        setEditingSecrets,
    } = useIntegrationPicker({
        token,
        baseUrl,
        accountId,
        onSuccess,
        dashboardUrl,
        debug,
    });

    const shownGuide = inlineGuide(connectionGuide, useFeatureFlags(CONNECTION_GUIDE_FLAG));

    const guideReader = useGuideReader(selectedIntegration?.integration_id);
    const [containerRef, width] = useMeasuredWidth<HTMLDivElement>();
    const hasGuide = shownGuide !== undefined && guidePages(shownGuide).length > 0;
    const layout = guideLayout(width);
    const formShowing = showsIntegrationForm({
        isLoading,
        hasError,
        connectionState,
        selectedIntegration,
        connectorData: connectorData?.config ?? null,
    });

    const connectionGuideElement = (placement: 'beside' | 'stacked') =>
        shownGuide ? (
            <ConnectionGuide
                connectorKey={connectorData?.config?.key ?? ''}
                guide={shownGuide}
                layout={placement}
                page={guideReader.page}
                onPageChange={guideReader.setPage}
            />
        ) : null;

    const handleValidationChange = useCallback(
        (isValid: boolean) => {
            setIsFormValid(isValid);
        },
        [setIsFormValid],
    );

    const hasOnlyOneIntegration = useMemo(() => {
        if (!hubData) return false;
        const activeIntegrations = hubData.integrations.filter((integration) => integration.active);
        return activeIntegrations.length === 1;
    }, [hubData]);

    // Only the close in the header: nothing loaded yet, or nothing could be, and no connector
    // header to stand in. A load that follows a change of account still has the old connector
    // cached, so loading is decided first.
    const connectorHeader = !isLoading && connectorData?.config != null;
    const loneClose = Boolean(closable) && !connectorHeader && (isLoading || hasError);

    const onBack = () => {
        setSelectedIntegration(null);
        resetConnectionState();
        setSelectedCategory(null);
        setSearch('');
    };

    const title =
        connectionState.loading || connectionState.success || (isLoading && !closable) ? null : (
            <IntegrationPickerTitle
                accountData={accountData}
                onBack={onBack}
                onClose={closable ? onClose : undefined}
                guide={headerGuideLink(guide, shownGuide)}
                isLoading={isLoading}
                hasError={hasError}
                hubData={hubData}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onSearchChange={setSearch}
                hideBackButton={
                    connectionState.loading || connectionState.success || hasOnlyOneIntegration
                }
                connectorData={connectorData?.config ?? null}
                profiles={profiles}
                selectedProfileId={selectedIntegration?.integration_id}
                onProfileChange={selectProfile}
            />
        );
    const headerConfig =
        selectedIntegration && !loneClose
            ? undefined
            : {
                  padding: '0',
              };

    const card = (
        <Card
            glassFooter
            footer={
                connectionState.success ? (
                    <SuccessCardFooter
                        onClose={onClose}
                        showFooterLinks={showFooterLinks}
                        onCloseLabel={onCloseLabel}
                    />
                ) : (
                    <CardFooter
                        selectedIntegration={selectedIntegration}
                        showActions={
                            !isLoading && !connectionState.loading && !connectionState.success
                        }
                        onBack={accountData || hasOnlyOneIntegration ? undefined : onBack}
                        onNext={handleConnect}
                        isFormValid={isFormValid}
                        showFooterLinks={showFooterLinks}
                    />
                )
            }
            title={hasGuide ? undefined : title}
            height={hasGuide ? '100%' : height}
            padding="0"
            style={hasGuide ? fillingCardStyle : undefined}
            headerConfig={hasGuide ? undefined : headerConfig}
        >
            {connectionState.timedOut && (
                <Alert type="warning" message="Connection timed out. Please try again." hasMargin />
            )}
            <IntegrationPickerContent
                isLoading={isLoading}
                hasError={hasError}
                connectionState={connectionState}
                selectedIntegration={selectedIntegration}
                connectorData={connectorData?.config ?? null}
                hubData={hubData ?? null}
                fields={fields}
                notices={notices}
                guide={
                    hasGuide
                        ? {
                              shown: guideReader.shown,
                              onToggle: guideReader.toggleShown,
                              // Held back until measured, so the guide appears in the layout
                              // that fits rather than jumping on first paint.
                              stacked:
                                  width !== undefined && layout === 'stacked'
                                      ? connectionGuideElement('stacked')
                                      : undefined,
                          }
                        : undefined
                }
                errorHubData={(errorHubData as Error) ?? null}
                errorConnectorData={(errorConnectorData as Error) ?? null}
                onSelect={setSelectedIntegration}
                onChange={setFormData}
                onValidationChange={handleValidationChange}
                onCancelOAuth={handleCancelOAuth}
                selectedCategory={selectedCategory}
                search={search}
                editingSecrets={editingSecrets}
                setEditingSecrets={setEditingSecrets}
            />
        </Card>
    );

    if (!hasGuide) {
        return card;
    }

    return (
        <Card title={title} headerConfig={headerConfig} height={height} padding="0">
            <div ref={containerRef} style={wrapperStyle}>
                {width !== undefined && layout === 'beside' && formShowing && guideReader.shown
                    ? connectionGuideElement('beside')
                    : null}
                {card}
            </div>
        </Card>
    );
};
