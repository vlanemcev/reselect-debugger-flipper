import { Selector } from '../types';

export const isFunction = (func: unknown): boolean => typeof func === 'function';

export const isSelector = (selector: Selector): boolean =>
  (selector && Boolean(selector.resultFunc)) || isFunction(selector);

export const sumString = (selector: Selector): number =>
  Array.from(selector.toString()).reduce((sum, char) => char.charCodeAt(0) + sum, 0);
