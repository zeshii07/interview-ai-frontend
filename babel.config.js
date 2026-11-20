module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // REQUIRED by react-native-reanimated v4 (used by the interview session
      // screen, the simulation overlay, and the confetti view). Without this
      // plugin every worklet call crashes at runtime with
      // "Reanimated failed to create a worklet" / missing worklet factory.
      'react-native-worklets/plugin',
    ],
  };
};
