module.exports = {
  root: true,
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  rules: {
    // spike for webstorm error (https://youtrack.jetbrains.com/issue/WEB-13304)
    indent: ["error", 2, { "ignoreComments": true, "SwitchCase": 1 }]
  },
  globals: {}
}
