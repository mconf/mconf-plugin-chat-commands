import { GenericContentSidekickArea, GenericContentMainArea } from 'bigbluebutton-html-plugin-sdk';

interface InjectedContent {
  id: string;
  name: string;
  instance: GenericContentSidekickArea | GenericContentMainArea;
}

type PluginApi = {
  setGenericContentItems?: (
    items: Array<GenericContentSidekickArea | GenericContentMainArea>
  ) => void;
};

// Global storage of injected sidekicks
const injectedSidekicks = new Map<string, InjectedContent>();

// Global storage of injected main contents
const injectedMainContents = new Map<string, InjectedContent>();

export type ContentType = 'sidekick' | 'main';

const getMap = (type: ContentType): Map<string, InjectedContent> => (
  type === 'sidekick' ? injectedSidekicks : injectedMainContents
);

let pluginApiRef: PluginApi | null = null;

export const genericContentManager = {
  // Set reference to pluginApi for updating content
  setPluginApi: (api: PluginApi): void => {
    pluginApiRef = api;
  },

  // Add or update content
  addContent: (
    type: ContentType,
    id: string,
    name: string,
    instance: GenericContentSidekickArea | GenericContentMainArea,
  ): void => {
    getMap(type).set(id, { id, name, instance });
    genericContentManager.updateDisplay();
  },

  // Update display with all content (sidekick + main)
  updateDisplay: (): void => {
    if (!pluginApiRef) return;
    const allContent = [
      ...Array.from(injectedSidekicks.values()).map((item) => item.instance),
      ...Array.from(injectedMainContents.values()).map((item) => item.instance),
    ];
    pluginApiRef.setGenericContentItems?.(allContent);
  },

  // Get all content instances of a type
  getAllInstances: (type: ContentType): (GenericContentSidekickArea | GenericContentMainArea)[] => (
    Array.from(getMap(type).values()).map((item) => item.instance)
  ),

  // Get all content IDs and names of a type
  getAllContent: (type: ContentType): Array<{ id: string; name: string }> => (
    Array.from(getMap(type).values()).map((item) => ({
      id: item.id,
      name: item.name,
    }))
  ),

  // Remove content by ID
  removeContent: (type: ContentType, id: string): boolean => {
    const removed = getMap(type).delete(id);
    if (removed) {
      genericContentManager.updateDisplay();
    }
    return removed;
  },

  // Remove all content of a type
  removeAllContent: (type: ContentType): void => {
    getMap(type).clear();
    genericContentManager.updateDisplay();
  },

  // Check if content exists
  exists: (type: ContentType, id: string): boolean => getMap(type).has(id),

  // Get content name by ID
  getContentName: (type: ContentType, id: string): string | undefined => getMap(type).get(id)?.name,

  // Find and remove content by ID in any type
  removeContentById: (id: string): { type: ContentType; found: boolean } | null => {
    const types: ContentType[] = ['sidekick', 'main'];
    const found = types.find((type) => getMap(type).has(id));
    if (found) {
      getMap(found).delete(id);
      genericContentManager.updateDisplay();
      return { type: found, found: true };
    }
    return null;
  },
};
