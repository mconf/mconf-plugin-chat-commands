const latestSdkState: Record<string, unknown> = {};

export const setSdkState = (name: string, value: unknown): void => {
  latestSdkState[name] = value;
};

export const getSdkState = (): Record<string, unknown> => ({ ...latestSdkState });
