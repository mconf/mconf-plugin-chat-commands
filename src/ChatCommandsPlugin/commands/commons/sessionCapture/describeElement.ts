import {
  INTERACTIVE_ELEMENT_SELECTOR,
  MAX_ELEMENT_TEXT_LENGTH,
  MAX_LABEL_ANCESTOR_DISTANCE,
} from './constants';
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

const normalizeText = (text?: string | null): string => (text ?? '').trim().replace(/\s+/g, ' ');

const nearbyAncestorAriaLabel = (element: Element): string => {
  let current = element.parentElement;
  for (let distance = 0; current && distance < MAX_LABEL_ANCESTOR_DISTANCE; distance += 1) {
    const ariaLabel = current.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    current = current.parentElement;
  }
  return '';
};

// Form controls are often named by something other than their own attributes:
// BBB's settings toggles are MUI Switches, whose aria-label sits on a wrapping
// <span> while the <input> only carries the data-test.
const externalLabel = (element: Element): string => {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy.split(/\s+/)
      .map((id) => normalizeText(document.getElementById(id)?.textContent))
      .filter(Boolean)
      .join(' ');
    if (text) return text;
  }
  const { labels } = element as HTMLInputElement;
  const labelText = labels
    ? Array.from(labels).map((label) => normalizeText(label.textContent)).filter(Boolean).join(' ')
    : '';
  return labelText || nearbyAncestorAriaLabel(element);
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
  const text = normalizeText((element as HTMLElement).innerText);
  const ancestor = findLabelledAncestor(element);

  const descriptor: ElementDescriptor = { tag: element.tagName.toLowerCase() };
  if (element.id) descriptor.id = element.id;
  const dataTest = element.getAttribute('data-test');
  if (dataTest) descriptor.dataTest = dataTest;
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) descriptor.ariaLabel = ariaLabel;
  const label = externalLabel(element);
  if (label) descriptor.label = truncate(label, MAX_ELEMENT_TEXT_LENGTH);
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
  const visible = descriptor.ariaLabel || descriptor.label || descriptor.text || descriptor.title;
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
