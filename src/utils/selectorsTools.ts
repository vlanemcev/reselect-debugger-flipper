import {
  AnalyzedSelectorResult,
  CreateSelectorGraphOptions,
  GraphRepresentation,
  Selector,
  SelectorsToRegister,
  StateGetter,
} from '../types';
import { isFunction, isSelector, sumString } from './common';

const allSelectors = new Set<Selector>();

export const namespaceSelectors = (selectors: SelectorsToRegister, prefix: string) => {
  const namespaced: SelectorsToRegister = {};

  Object.entries(selectors).forEach(([name, func]) => {
    namespaced[`${prefix}:${name}`] = func;
  });

  return namespaced;
};

const addSelector = (selector: Selector) => {
  allSelectors.add(selector);

  const dependencies = selector.dependencies || [];
  dependencies.forEach(addSelector);
};

export function registerSelectors(selectors: SelectorsToRegister) {
  Object.keys(selectors).forEach((name) => {
    const selector = selectors[name];

    if (isSelector(selector)) {
      selector.selectorName = name;
      addSelector(selector);
    }
  });
}

export function analyzeSelector(selector: Selector | string, stateGetter?: StateGetter) {
  if (typeof selector === 'string') {
    for (const possibleSelector of allSelectors) {
      if (possibleSelector.selectorName === selector) {
        selector = possibleSelector;
        break;
      }
    }
  }

  if (!isFunction(selector)) {
    throw new Error(`Selector ${selector} is not a function...has it been registered?`);
  }

  const receivedSelector = selector as Selector;

  const { dependencies = [], selectorName = null } = receivedSelector;

  const isNamed = typeof selectorName === 'string';
  const recomputations = receivedSelector.recomputations ? receivedSelector.recomputations() : null;

  const analyzingResult: AnalyzedSelectorResult = {
    dependencies,
    recomputations,
    isNamed,
    selectorName,
    selectorInputs: null,
    outputIsStateDependentOnly: null,
    selectorOutput: null,
    analyzingError: null,
  };

  if (stateGetter) {
    const state = stateGetter();

    try {
      const outputIsStateDependentOnly = dependencies.every(
        // check input selectors if it has external arguments
        // if true -> we can`t get selectors output because it will lead to increase recomputations count
        (inputSelector) => inputSelector.length < 2,
      );

      analyzingResult.outputIsStateDependentOnly = outputIsStateDependentOnly;

      try {
        const inputs = dependencies.map((parentSelector) => parentSelector(state));

        if (inputs.length > 0) {
          analyzingResult.selectorInputs = inputs;
        }
      } catch (e) {
        analyzingResult.analyzingError = `checkSelector: error when getting Inputs of selector ${selectorName}. The error was:\n${e}`;
      }

      if (outputIsStateDependentOnly) {
        try {
          analyzingResult.selectorOutput = receivedSelector(state);
        } catch (e) {
          analyzingResult.analyzingError = `checkSelector: error when getting Output of selector ${selectorName}. The error was:\n${e}`;
        }
      } else {
        analyzingResult.selectorOutput = 'Can`t get it because it depends on external arguments';
      }
    } catch (e) {
      analyzingResult.analyzingError = `checkSelector: error when trying to check Inputs arguments count of selector ${selectorName}. The error was:\n${e}`;
    }
  }

  return analyzingResult;
}

const defaultSelectorKey = (selector: Selector) => {
  if (selector.selectorName) {
    return selector.selectorName;
  }

  // if it's a vanilla function, it will have a name
  if (selector.name) {
    return selector.name;
  }

  return (selector.dependencies || []).reduce((base, dep) => {
    return base + sumString(dep);
  }, (selector.resultFunc ? selector.resultFunc : selector).toString());
};

export function createSelectorGraph(options?: CreateSelectorGraphOptions): GraphRepresentation {
  const selectorKeyGetter = options?.selectorKeyGetter || defaultSelectorKey;

  const graph: GraphRepresentation = {
    nodes: {},
    edges: [],
  };

  const addToGraph = (selector: Selector) => {
    const name = selectorKeyGetter(selector);

    if (graph.nodes[name]) {
      return;
    }

    const {
      dependencies,
      recomputations,
      isNamed,
      selectorInputs,
      outputIsStateDependentOnly,
      selectorOutput,
      analyzingError,
    } = analyzeSelector(selector, options?.stateGetter);

    graph.nodes[name] = {
      isNamed,
      name,
      recomputations,
      lastRecomputationReasone: null,
      selectorInputs,
      outputIsStateDependentOnly,
      selectorOutput,
      analyzingError,
    };

    dependencies.forEach((dependency) => {
      addToGraph(dependency);

      graph.edges.push({
        from: name,
        to: selectorKeyGetter(dependency),
      });
    });
  };

  for (const selector of allSelectors) {
    addToGraph(selector);
  }

  return graph;
}

export const resetSelectorsRecomputationCount = () => {
  allSelectors.forEach((selector) => {
    // @ts-ignore the selector may not have this function
    if (selector?.resetRecomputations) {
      selector.resetRecomputations();
    }
  });
};

export function resetSelectorsState() {
  allSelectors.clear();
}
