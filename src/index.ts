import isEmpty from 'lodash.isempty';
import { addPlugin, Flipper } from 'react-native-flipper';
import { Action, Middleware } from 'redux';

import { GraphRepresentation, SelectorsToRegister, StateGetter } from './types';
import {
  resetSelectorsState,
  namespaceSelectors,
  createSelectorGraph,
  registerSelectors,
  resetSelectorsRecomputationCount,
} from './utils/selectorsTools';

interface ReselectDebbugerConfigProps {
  selectors: SelectorsToRegister;
  stateGetter?: StateGetter;
}

let reselectDebbugerConnection: Flipper.FlipperConnection | null = null;
let latestSelectorGraph: GraphRepresentation | null = null;

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

      latestSelectorGraph = createSelectorGraph({ stateGetter });

      // send created selector graph
      connection.send('setSelectorsGraph', latestSelectorGraph);

      // connection events subscribers
      connection.receive('refreshSelectorsGraph', (_, responder) => {
        latestSelectorGraph = createSelectorGraph({ stateGetter });
        responder.success(latestSelectorGraph);
      });

      connection.receive('resetSelectorsRecomputationCount', (_, responder) => {
        resetSelectorsRecomputationCount();

        latestSelectorGraph = createSelectorGraph({ stateGetter });
        responder.success(latestSelectorGraph);
      });
    },
    onDisconnect: () => {
      reselectDebbugerConnection = null;
      latestSelectorGraph = null;

      resetSelectorsState();
    },
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

  if (latestSelectorGraph) {
    // get latest selectors graph before any updates
    const currentNodes = latestSelectorGraph.nodes;

    // get reducer result
    const result = next(action);

    // get selectors graph after Store update
    latestSelectorGraph = createSelectorGraph({ stateGetter: store.getState });
    const nextNodes = latestSelectorGraph.nodes;
    const nnKeys = Object.keys(latestSelectorGraph.nodes);

    const nodesToUpdate: GraphRepresentation['nodes'] = {};

    // update nodes if action changed any selectors
    nnKeys.forEach((key) => {
      if (currentNodes[key].recomputations !== nextNodes[key].recomputations) {
        nodesToUpdate[key] = {
          ...nextNodes[key],

          // setting the recomputation reasone
          lastRecomputationReasone: `Action: ${(action as Action).type}`,
        };
      }
    });

    if (!isEmpty(nodesToUpdate)) {
      updateSelectorsGraph({
        nodes: { ...nextNodes, ...nodesToUpdate },
        edges: [...latestSelectorGraph.edges],
      });
    }

    return result;
  } else {
    return next(action);
  }
};

const ReselectDebbuger = {
  configure,
  reduxMiddleware,
  namespaceSelectors,
};

export default ReselectDebbuger;
