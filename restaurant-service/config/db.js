const prisma = require('./prisma');

module.exports = {
  authenticate: async () => Promise.resolve(),
  sync: async () => Promise.resolve(),
  transaction: async (cb) => {
    if (typeof cb === 'function') {
      return await cb(prisma);
    }
    return {
      commit: async () => {},
      rollback: async () => {},
      finished: true
    };
  },
  fn: (fnName, colName) => ({ fn: fnName, col: colName }),
  col: (colName) => colName
};
