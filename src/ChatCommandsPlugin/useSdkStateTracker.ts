import { useEffect, useRef } from 'react';
import {
  CurrentUserData,
  IntlLocaleUiDataNames,
  LayoutPresentationAreaUiDataNames,
  PluginApi,
  UserListUiDataNames,
} from 'bigbluebutton-html-plugin-sdk';
import { getSessionCapture } from './commands/commons/sessionCapture';
import { setSdkState } from './commands/commons/sdkStateStore';
import { USER_CLIENT_SETTINGS } from './subscriptions';
import { UserClientSettingsSubscription } from './types';

const useTrackedState = (name: string, value: unknown): void => {
  const previous = useRef<string | undefined>(undefined);
  const serialized = JSON.stringify(value);

  useEffect(() => {
    if (serialized === undefined || serialized === previous.current) return;
    const from = previous.current === undefined ? undefined : JSON.parse(previous.current);
    const to = JSON.parse(serialized);
    previous.current = serialized;
    setSdkState(name, to);
    getSessionCapture().recordEvent({
      kind: 'state',
      summary: `${name} changed`,
      data: { name, from, to },
    });
  }, [name, serialized]);
};

/**
 * Mirrors the client state the SDK exposes into the session capture, so the
 * report shows both the current values and how they changed over time.
 */
export const useSdkStateTracker = (
  pluginApi: PluginApi,
  currentUser: CurrentUserData | null,
): void => {
  const presentationArea = pluginApi.useUiData!(
    LayoutPresentationAreaUiDataNames.CURRENT_ELEMENT,
    [],
  );
  const userListOpen = pluginApi.useUiData!(
    UserListUiDataNames.USER_LIST_IS_OPEN,
    { value: false },
  );
  const locale = pluginApi.useUiData!(
    IntlLocaleUiDataNames.CURRENT_LOCALE,
    { locale: '', fallbackLocale: '' },
  );
  const currentPresentationResponse = pluginApi.useCurrentPresentation!();
  // The client pushes its whole settings object here when the layout is ready
  // and on every Save in the Settings modal, so it reflects what the modal
  // shows, including bbb_* userdata overrides that never reach storage.
  const clientSettingsResponse = pluginApi.useCustomSubscription!<UserClientSettingsSubscription>(
    USER_CLIENT_SETTINGS,
  );

  const currentPresentation = currentPresentationResponse?.data
    ? {
      presentationId: currentPresentationResponse.data.presentationId,
      page: currentPresentationResponse.data.currentPage?.num,
    }
    : undefined;

  const currentUserState = currentUser
    ? {
      userId: currentUser.userId,
      role: currentUser.role,
      presenter: currentUser.presenter,
      cameras: currentUser.cameras?.length ?? 0,
    }
    : undefined;

  useTrackedState('presentationArea', presentationArea);
  useTrackedState('userListOpen', userListOpen?.value);
  useTrackedState('locale', locale?.locale || undefined);
  useTrackedState('currentPresentation', currentPresentation);
  useTrackedState('currentUser', currentUserState);
  useTrackedState(
    'clientSettings',
    clientSettingsResponse?.data?.user_current?.[0]?.userClientSettings?.userClientSettingsJson,
  );
};
