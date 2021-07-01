const normalizers = [
  { pattern: /netlify-cli\/.+node-.+/g, value: 'netlify-cli/test-version test-os test-node-version' },
  { pattern: /\d{5}/g, value: '88888' },
  { pattern: /\\/g, value: '/' },
]

const normalize = (inputString) =>
  normalizers.reduce((acc, { pattern, value }) => acc.replace(pattern, value), inputString)

module.exports = { normalize }
