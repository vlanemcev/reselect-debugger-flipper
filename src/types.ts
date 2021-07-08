import { OutputSelector } from 'reselect';

export type Selector = OutputSelector<unknown, unknown, () => unknown> & {
  dependencies?: Selector[];
  selectorName?: string;
};

export type SelectorsToRegister = Record<string, Selector>;

export type ExtraAnalyzedSelectorResult = {
  selectorInputs: unknown[] | null;
  outputIsStateDependentOnly: boolean | null;
  selectorOutput: unknown | null;
  analyzingError: string | null;
};

export type AnalyzedSelectorResult = {
  dependencies: Selector[] | [];
  recomputations: number | null;
  isNamed: boolean;
  selectorName: string | null;
} & ExtraAnalyzedSelectorResult;

export type GraphNode = {
  isNamed: boolean;
  name: string;
  recomputations: number | null;
  lastRecomputationReasone: string | null;
} & ExtraAnalyzedSelectorResult;

export type GraphEdge = {
  from: string;
  to: string;
};

export type GraphRepresentation = {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
};

export type StateGetter = () => any;

export type CreateSelectorGraphOptions = {
  selectorKeyGetter?: (selector: Selector) => string;
  stateGetter?: StateGetter;
};
