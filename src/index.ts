import isEmpty from 'lodash.isempty';
import { addPlugin, Flipper } from 'react-native-flipper';
import { Action, Middleware } from 'redux';

import { GraphRepresentation, SelectorsToRegister, StateGetter } from './types';
import {
  analyzeSelector,
  createSelectorGraph,
  registerSelectors,
  resetSelectorsRecomputationCount,
} from './utils/selectorsTools';

interface ReselectDebbugerConfigProps {
  selectors: SelectorsToRegister;
  stateGetter?: StateGetter;
}

let reselectDebbugerConnection: Flipper.FlipperConnection | null = null;

/**
 * Register selectors and create Reselect Debugger Tools UI in Flipper
 *
 * @param selectors - pass the selectors as { [selectorName]: selector }
 * @param stateGetter - used to return selectors inputs / output
 */

const configure = ({ selectors, stateGetter }: ReselectDebbugerConfigProps) => {
  addPlugin({
    getId: () => 'reselect-debugger',
    onConnect: (connection) => {
      console.log('Reselect Debugger has successfully connected');

      // save flipper connection instance
      reselectDebbugerConnection = connection;

      registerSelectors(selectors);
      const selectorGraph = createSelectorGraph({ stateGetter });

      connection.send('setSelectorsGraph', selectorGraph);

      connection.receive('refreshSelectorsGraph', (_, responder) => {
        const selectorGraph = createSelectorGraph({ stateGetter });
        responder.success(selectorGraph);
      });

      connection.receive('resetSelectorsRecomputationCount', (_, responder) => {
        resetSelectorsRecomputationCount();

        const selectorGraph = createSelectorGraph({ stateGetter });

        responder.success(selectorGraph);
      });
    },
    onDisconnect: () => undefined,
    runInBackground: () => true,
  });
};

const updateSelectorsGraph = (updatedGraph: GraphRepresentation) => {
  if (reselectDebbugerConnection) {
    reselectDebbugerConnection.send('setSelectorsGraph', updatedGraph);
  }
};

const reduxMiddleware: Middleware = (store) => (next) => (action) => {
  // if this is an action creator
  if (typeof action === 'function') {
    return next(action);
  }

  // get selectors graph before any updates/
  const currentNodes = createSelectorGraph({ stateGetter: store.getState }).nodes;

  // get reducer result
  const result = next(action);

  // get selectors graph after Store update
  const nextGraph = createSelectorGraph({ stateGetter: store.getState });
  const nextNodes = nextGraph.nodes;
  const nnKeys = Object.keys(nextGraph.nodes);

  const nodesToUpdate: GraphRepresentation['nodes'] = {};

  // update nodes if action changed any selectors
  nnKeys.forEach((key) => {
    if (currentNodes[key].recomputations !== nextNodes[key].recomputations) {
      const { selectorInputs, selectorOutput, analyzingError, recomputations } = analyzeSelector(
        key,
        store.getState,
      );

      nodesToUpdate[key] = {
        // save static node information
        ...nextNodes[key],
        recomputations,
        // setting the recomputation reasone
        lastRecomputationReasone: `Action: ${(action as Action).type}`,
        // updating selectors analyze info
        selectorInputs,
        selectorOutput,
        analyzingError,
      };
    }
  });

  if (!isEmpty(nodesToUpdate)) {
    updateSelectorsGraph({
      nodes: { ...nextNodes, ...nodesToUpdate },
      edges: [...nextGraph.edges],
    });
  }

  return result;
};

const ReselectDebbuger = {
  configure,
  reduxMiddleware,
};

export default ReselectDebbuger;
