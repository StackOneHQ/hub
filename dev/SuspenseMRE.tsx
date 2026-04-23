import { Suspense, startTransition, useCallback, useEffect, useState } from 'react';
import {
    RelayEnvironmentProvider,
    fetchQuery,
    graphql,
    useLazyLoadQuery,
    useMutation,
    useRelayEnvironment,
} from 'react-relay';
import { StackOneHub } from '../src/StackOneHub';
import { relayEnvironment } from './RelayEnvironment';
import type { SuspenseMREConfirmAccountMutation } from './__generated__/SuspenseMREConfirmAccountMutation.graphql';
import type { SuspenseMRECreateSessionMutation } from './__generated__/SuspenseMRECreateSessionMutation.graphql';
import type { SuspenseMREProvidersQuery } from './__generated__/SuspenseMREProvidersQuery.graphql';

const PROVIDER_KEY = 'jira';

const providersQuery = graphql`
    query SuspenseMREProvidersQuery {
        viewer @required(action: THROW) {
            stackOneProviders {
                key
                name
                version
                integrationId
            }
        }
    }
`;

const createSessionMutation = graphql`
    mutation SuspenseMRECreateSessionMutation($input: CreateStackOneConnectSessionInput!) {
        createStackOneConnectSession(input: $input) {
            token
            errors
        }
    }
`;

const confirmAccountMutation = graphql`
    mutation SuspenseMREConfirmAccountMutation($input: ConfirmStackOneAccountInput!) {
        confirmStackOneAccount(input: $input) {
            stackOneAccount {
                id
                stackOneAccountId
                provider
                status
            }
            errors
        }
    }
`;

type ConnectState =
    | { status: 'idle' }
    | { status: 'creating_session' }
    | { status: 'hub_open'; token: string }
    | { status: 'confirming_account' }
    | { status: 'done'; message: string }
    | { status: 'error'; message: string };

function SuspenseMREContent() {
    const [connectState, setConnectState] = useState<ConnectState>({ status: 'idle' });
    const [manualToken, setManualToken] = useState<string>('');
    const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.stackone.com';
    const appUrl = import.meta.env.VITE_APP_URL ?? 'https://app.stackone.com';
    const isCorsProtected = !apiUrl.includes('localhost');

    console.log(`[SuspenseMRE] render — status=${connectState.status}`);

    const data = useLazyLoadQuery<SuspenseMREProvidersQuery>(
        providersQuery,
        {},
        { fetchPolicy: 'network-only' },
    );

    const providers = data?.viewer?.stackOneProviders ?? [];
    const jiraProvider = providers.find((p: { key: string }) => p.key === PROVIDER_KEY);

    const [commitCreateSession] =
        useMutation<SuspenseMRECreateSessionMutation>(createSessionMutation);
    const [commitConfirmAccount] =
        useMutation<SuspenseMREConfirmAccountMutation>(confirmAccountMutation);

    const handleSuccess = useCallback(
        (account: { id: string; provider: string }) => {
            console.log('[SuspenseMRE] onSuccess:', account);
            setConnectState({ status: 'confirming_account' });

            commitConfirmAccount({
                variables: {
                    input: { stackoneAccountId: account.id, provider: account.provider },
                },
                onCompleted: (responseData) => {
                    const { errors } = responseData.confirmStackOneAccount ?? {};
                    if (errors?.length) {
                        setConnectState({
                            status: 'error',
                            message: errors[0] ?? 'Failed to link account',
                        });
                        return;
                    }
                    setConnectState({
                        status: 'done',
                        message: `Account linked: ${account.id} (${account.provider})`,
                    });
                },
                onError: (error: Error) => {
                    setConnectState({
                        status: 'error',
                        message: `Confirm failed: ${String(error)}`,
                    });
                },
            });
        },
        [commitConfirmAccount],
    );

    const handleClose = useCallback(() => {
        console.log('[SuspenseMRE] onClose — resetting to idle');
        setConnectState({ status: 'idle' });
    }, []);

    const requestToken = useCallback(() => {
        if (!jiraProvider) {
            setConnectState({ status: 'error', message: `Provider "${PROVIDER_KEY}" not found` });
            return;
        }

        console.log('[SuspenseMRE] requesting session token');
        setConnectState({ status: 'creating_session' });

        commitCreateSession({
            variables: {
                input: {
                    provider: PROVIDER_KEY,
                    providerVersion: jiraProvider.version ?? undefined,
                    integrationId: jiraProvider.integrationId ?? undefined,
                },
            },
            onCompleted: (responseData) => {
                const { token, errors } = responseData.createStackOneConnectSession ?? {};
                if (errors?.length) {
                    setConnectState({
                        status: 'error',
                        message: errors[0] ?? 'Failed to create session',
                    });
                    return;
                }
                if (!token) {
                    setConnectState({ status: 'error', message: 'No token returned' });
                    return;
                }
                console.log('[SuspenseMRE] session token created');
                setConnectState({ status: 'hub_open', token });
            },
            onError: (error: Error) => {
                setConnectState({
                    status: 'error',
                    message: `CreateSession failed: ${String(error)}`,
                });
            },
        });
    }, [jiraProvider, commitCreateSession]);

    // Auto-start on mount — matches client's pattern
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional empty deps to run once on mount
    useEffect(() => {
        if (isCorsProtected) return;
        startTransition(() => {
            requestToken();
        });
    }, []);

    return (
        <div style={{ padding: 24, fontFamily: 'monospace', maxWidth: 800 }}>
            <h2>Suspense MRE — OAuth Debug</h2>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'sans-serif' }}>
                Replicates client structure: Suspense + useLazyLoadQuery (network-only) +
                startTransition session creation. Check console for state transitions.
            </p>

            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div>
                    <strong>Provider:</strong> {PROVIDER_KEY}
                </div>
                <div>
                    <strong>Version:</strong> {jiraProvider?.version ?? 'N/A'}
                </div>
                <div>
                    <strong>State:</strong> {connectState.status}
                </div>
                {'message' in connectState && (
                    <div>
                        <strong>Message:</strong> {connectState.message}
                    </div>
                )}
            </div>

            {isCorsProtected && connectState.status === 'idle' && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        Paste a connect session token (the /connect_sessions endpoint is
                        CORS-protected on dev and production so it cannot be automatically created
                        by this frontend only demo app).
                    </div>
                    <input
                        type="text"
                        placeholder="Connect session token"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px 8px',
                            marginBottom: 8,
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                        }}
                    />
                    <button
                        onClick={() => setConnectState({ status: 'hub_open', token: manualToken })}
                        disabled={!manualToken}
                    >
                        Use token
                    </button>
                </div>
            )}

            {(connectState.status === 'creating_session' ||
                connectState.status === 'confirming_account') && (
                <div>Loading ({connectState.status})...</div>
            )}

            {connectState.status === 'error' && (
                <div>
                    <div style={{ color: 'red', marginBottom: 8 }}>{connectState.message}</div>
                    <button onClick={requestToken}>retry</button>
                </div>
            )}

            {connectState.status === 'done' && (
                <div style={{ color: 'green' }}>{connectState.message}</div>
            )}

            {connectState.status === 'hub_open' && (
                <div>
                    <button
                        onClick={() =>
                            setConnectState({ status: 'hub_open', token: 'invalid-token' })
                        }
                        style={{
                            marginBottom: 8,
                            padding: '4px 8px',
                            background: '#fdd',
                            border: '1px solid #f99',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontSize: 12,
                        }}
                    >
                        simulate token expiry
                    </button>
                    <StackOneHub
                        key={connectState.token}
                        token={connectState.token}
                        onSuccess={handleSuccess}
                        onClose={handleClose}
                        baseUrl={apiUrl}
                        appUrl={appUrl}
                        debug
                    />
                </div>
            )}
        </div>
    );
}

function BackgroundPoller() {
    const environment = useRelayEnvironment();
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('[BackgroundPoller] polling store');
            fetchQuery(environment, providersQuery, {}).subscribe({
                next: () => console.log('[BackgroundPoller] store updated'),
                error: console.error,
            });
        }, 15000);
        return () => clearInterval(interval);
    }, [environment]);
    return null;
}

export function SuspenseMRE() {
    return (
        <RelayEnvironmentProvider environment={relayEnvironment}>
            <BackgroundPoller />
            <Suspense
                fallback={
                    <div style={{ padding: 24, fontFamily: 'monospace' }}>Loading providers...</div>
                }
            >
                <SuspenseMREContent />
            </Suspense>
        </RelayEnvironmentProvider>
    );
}
