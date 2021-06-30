# Reselect Debugger Plugin for Flipper

`flipper-plugin-reselect-debugger` allows you debug Reselect selectors inside [Flipper](https://fbflipper.com/)

- Recomputations of selector
- Selectors Inputs
- Selectors Output
- Last Recomputation reasone
- Dependency Graph
- Highlight Most Recomputed Selectors
- Search by Selectors Graph

## Get Started

1. Install [reselect-debugger-flipper](https://github.com/vlanemcev/reselect-debugger-flipper) and `react-native-flipper` in your React Native app:

```bash
yarn add reselect-debugger-flipper react-native-flipper
# for iOS
cd ios && pod install
```

1. Add the configurations into your store (Redux in this example):

```javascript
import { createStore, applyMiddleware } from 'redux';

const middlewares = [/* other middlewares */];

const store = createStore(RootReducer, applyMiddleware(...middlewares));

const reselectDebugger = require('reselect-debugger-flipper').default;
reselectDebugger.configure({
  selectors
});

return store;
```

2. Install [flipper-plugin-reselect-debugger](https://github.com/vlanemcev/flipper-plugin-reselect-debugger) in Flipper desktop client:

```
Manage Plugins > Install Plugins > search "reselect-debugger" > Install
```

3. Start your app, then you should be able to see Redux Debugger on your Flipper app

## Optional Configuration

### Selector Input / Outputs

By default, outputs only the recomputations of the selector. If you use will pass `stateGetter` parameter, it will output the selector's input and output values. 

```javascript
import { createStore, applyMiddleware } from 'redux';

const middlewares = [/* other middlewares */];

const store = createStore(RootReducer, applyMiddleware(...middlewares));

const reselectDebugger = require('reselect-debugger-flipper').default;
reselectDebugger.configure({
  selectors,

  /* to calculate input / outputs of selectors */
  stateGetter: store.getState,
});

return store;
```

### Selectors live updates

You can keep track of how your selectors are recalculated while the application is running.

This is available for Redux and implemented with a middelware connection. 

Every time you dispatch an action, selectors will be re-run and analyzed to see if there was a recalculation. 
If recalculation has occurred, a property will be available that displays the last action due to which the recalculation occurred.

```javascript
import { createStore, applyMiddleware } from 'redux';

const middlewares = [/* other middlewares */];

if (__DEV__) {
  const reselectDebugger = require('reselect-debugger-flipper').default;

  /* to enable reselect debugger live updates */
  middlewares.push(reselectDebugger.reduxMiddleware);
}
```

## Acknowledgement

This plugin is inspired by [reselect-tools](https://github.com/skortchmark9/reselect-tools) which only for Web.
