// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    'expo',
    'prettier', // disables formatting rules that conflict with Prettier
  ],
  ignorePatterns: ['/dist/*'],
};
