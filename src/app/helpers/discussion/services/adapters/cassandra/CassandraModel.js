var models = require('express-cassandra')

models.setDirectory(__dirname + '/models').bind(
  {
    clientOptions: {
      contactPoints: ['110.0.0.5'],
      protocolOptions: { port: 9042 },
      keyspace: 'discussions',
      queryOptions: {consistency: models.consistencies.one}
    },
    ormOptions: {
      defaultReplicationStrategy: {
        class: 'SimpleStrategy',
        replication_factor: 1
      },
      migration: 'safe'
    }
  },
  function (err) {
    if (err) throw err
  }
)

module.exports = models
