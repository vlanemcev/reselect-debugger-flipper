# Reselect Debugger Plugin for Flipper

`flipper-plugin-reselect-debugger` allows you debug Reselect selectors inside [Flipper](https://fbflipper.com/)

Currently supported:

- Recomputations of selector
- Selectors Inputs
- Selectors Output
- Last Recomputation reasone
- Dependency Graph

## Get Started

1. Install [reselect-debugger-flipper](https://github.com/vlanemcev/reselect-debugger-flipper) and `react-native-flipper` in your React Native app:

```bash
yarn add reselect-debugger-flipper react-native-flipper
# for iOS
cd ios && pod install
```

2. Add the configurations into your redux store:

```javascript
import { createStore, applyMiddleware } from 'redux';

const middlewares = [/* other middlewares */];

if (__DEV__) {
  const reselectDebugger = require('reselect-debugger-flipper').default;

  /* to enable reselect debugger live updates */
  middlewares.push(reselectDebugger.reduxMiddleware);
}

const store = createStore(RootReducer, applyMiddleware(...middlewares));

const reselectDebugger = require('reselect-debugger-flipper').default;
reselectDebugger.configure({
  selectors,

  /* to calculate input / outputs of selectors */
  stateGetter: store.getState,
});

return store;
```

1. Install [flipper-plugin-reselect-debugger](https://github.com/vlanemcev/flipper-plugin-reselect-debugger) in Flipper desktop client:

```
Manage Plugins > Install Plugins > search "reselect-debugger" > Install
```

4. Start your app, then you should be able to see Redux Debugger on your Flipper app

## Acknowledgement

This plugin is inspired by [reselect-tools](https://github.com/skortchmark9/reselect-tools) which only for Web.
