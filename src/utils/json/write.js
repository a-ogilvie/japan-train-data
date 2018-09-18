const path = require('path')
const jsonfile = require('jsonfile')

jsonfile.spaces = 2

const ROOT = path.resolve(__dirname, '..', '..', '..')

module.exports = function jsonWrite (file, data) {
  return jsonfile.writeFileSync(path.join(ROOT, file), data)
};
