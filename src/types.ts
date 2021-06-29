import { OutputSelector } from 'reselect';

export type Selector = OutputSelector<unknown, unknown, () => unknown> & {
  dependencies?: Selector[];
  selectorName?: string;
};

export type SelectorsToRegister = Record<string, Selector>;

export type ExtraAnalyzedSelectorResult = {
  selectorInputs: unknown[] | null;
  selectorOutput: unknown | null;
  analyzingError: string | null;
};

export type AnalyzedSelectorResult = {
  dependencies: Selector[] | [];
  recomputations: number | null;
  isNamed: boolean;
  selectorName: string | null;
} & ExtraAnalyzedSelectorResult;

export type GraphRepresentation = {
  nodes: Record<
    string,
    {
      isNamed: boolean;
      name: string;
      recomputations: number | null;
      lastRecomputationReasone: string | null;
    } & ExtraAnalyzedSelectorResult
  >;
  edges: {
    from: string;
    to: string;
  }[];
};

export type StateGetter = () => any;

export type CreateSelectorGraphOptions = {
  selectorKeyGetter?: (selector: Selector) => string;
  stateGetter?: StateGetter;
};
