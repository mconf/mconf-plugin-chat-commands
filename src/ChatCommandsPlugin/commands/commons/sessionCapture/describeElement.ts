import { INTERACTIVE_ELEMENT_SELECTOR, MAX_ELEMENT_TEXT_LENGTH } from './constants';
import { truncate } from './serialize';
import { ElementDescriptor } from './types';

const shortIdentity = (element: Element): string => {
  const dataTest = element.getAttribute('data-test');
  if (dataTest) return `[data-test="${dataTest}"]`;
  if (element.id) return `#${element.id}`;
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${ariaLabel}"]`;
  return element.tagName.toLowerCase();
};

const findLabelledAncestor = (element: Element): Element | null => {
  let current = element.parentElement;
  while (current) {
    if (current.getAttribute('data-test') || current.id) return current;
    current = current.parentElement;
  }
  return null;
};

/**
 * Climbs from the raw event target (often an <svg> icon or a <span>) to the
 * element a user would consider "clicked", and describes it by the attributes
 * that survive styled-components' hashed class names.
 */
export const describeElement = (target: EventTarget | null): ElementDescriptor | undefined => {
  if (!(target instanceof Element)) return undefined;
  const element = target.closest(INTERACTIVE_ELEMENT_SELECTOR) ?? target;
  const text = (element as HTMLElement).innerText?.trim().replace(/\s+/g, ' ');
  const ancestor = findLabelledAncestor(element);

  const descriptor: ElementDescriptor = { tag: element.tagName.toLowerCase() };
  if (element.id) descriptor.id = element.id;
  const dataTest = element.getAttribute('data-test');
  if (dataTest) descriptor.dataTest = dataTest;
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) descriptor.ariaLabel = ariaLabel;
  const role = element.getAttribute('role');
  if (role) descriptor.role = role;
  const title = element.getAttribute('title');
  if (title) descriptor.title = title;
  if (text) descriptor.text = truncate(text, MAX_ELEMENT_TEXT_LENGTH);
  if (ancestor) descriptor.within = shortIdentity(ancestor);
  return descriptor;
};

/** What the user sees on the element, for reading the steps in plain text. */
export const humanLabel = (descriptor?: ElementDescriptor): string => {
  if (!descriptor) return 'unknown element';
  const visible = descriptor.ariaLabel || descriptor.text || descriptor.title;
  if (visible) return visible;
  if (descriptor.id) return `#${descriptor.id}`;
  return `unlabeled <${descriptor.tag}>`;
};

export const elementLabel = (descriptor?: ElementDescriptor): string => {
  if (!descriptor) return 'unknown element';
  if (descriptor.dataTest) return `[data-test="${descriptor.dataTest}"]`;
  if (descriptor.id) return `#${descriptor.id}`;
  if (descriptor.ariaLabel) return `${descriptor.tag}[aria-label="${descriptor.ariaLabel}"]`;
  if (descriptor.text) return `${descriptor.tag} "${descriptor.text}"`;
  return descriptor.tag;
};
