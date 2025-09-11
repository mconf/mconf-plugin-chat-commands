import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BbbPluginSdk, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import ChatCommandsPlugin from './ChatCommandsPlugin/component';

const uuid = document.currentScript?.getAttribute('uuid') || 'root';

function PluginInitializer({ pluginUuid }: { pluginUuid: string }): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(pluginUuid);

  return <ChatCommandsPlugin pluginApi={pluginApi} />;
}

const root = ReactDOM.createRoot(document.getElementById(uuid));
root.render(
  <React.StrictMode>
    <PluginInitializer pluginUuid={uuid} />
  </React.StrictMode>,
);
