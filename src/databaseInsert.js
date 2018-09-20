'use strict';

const MongoClient = require('mongodb').MongoClient;

const URL = 'mongodb://localhost:27000/';
const formattedData = require('../data/formatted-data.json');

MongoClient.connect(
  URL,
  { useNewUrlParser: true },
)
  .then(async (db) => {
    const zehitomo = db.db('zehitomo');

    for (let i = 0; i < formattedData.length; i++) {
      const line = formattedData[i];
      const locationPromises = line.stations.map(station =>
        zehitomo.collection('locations').findOne({ zipCode: station.zipCode }),
      );

      const locations = await Promise.all(locationPromises).catch((error) => {
        console.log('Location promise rejected');
        console.log(error);
      });

      // console.log(locations);

      for (let j = 0; j < locations.length; j++) {
        if (!locations[j]) {
          line.stations[j].locationId = null;
        } else {
          line.stations[j].locationId = locations[j]._id;
        }
      }

      const prefecturePromises = line.prefectureIds.map(id =>
        zehitomo.collection('location_prefectures').findOne({ name: id }),
      );

      const prefectures = await Promise.all(prefecturePromises).catch(
        (error) => {
          console.log('Prefecture promise rejected');
          console.log(error);
        },
      );

      const prefectureIds = prefectures.map(prefecture => prefecture.id);

      line.prefectureIds = prefectureIds;
    }

    const linePromises = formattedData.map(line =>
      zehitomo.collection('train_lines').insertOne(line),
    );

    await Promise.all(linePromises).catch((error) => {
      console.log('Insertion failed');
      console.log(error);
    });

    return db;
  })
  .then((db) => {
    db.close();
    console.log('Database closed!');
  });
