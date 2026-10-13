import { DeviceLabels } from './types';

type JsonObject = Record<string, unknown>;

/**
 * Settings hold opaque device IDs; the report shows the device names instead.
 * Names are only exposed once the page has been granted media permission.
 */
export const resolveDeviceLabels = async (settings: JsonObject): Promise<DeviceLabels> => {
  const audio = (settings.audio ?? {}) as JsonObject;
  if (!navigator.mediaDevices?.enumerateDevices) return {};

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const labelOf = (deviceId: unknown) => (
      typeof deviceId === 'string'
        ? devices.find((device) => device.deviceId === deviceId)?.label || undefined
        : undefined
    );
    return {
      inputDeviceId: labelOf(audio.inputDeviceId),
      outputDeviceId: labelOf(audio.outputDeviceId),
    };
  } catch (error) {
    return {};
  }
};
