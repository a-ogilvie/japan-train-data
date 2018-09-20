'use strict';

const MongoClient = require('mongodb').MongoClient;

const URL = 'mongodb://localhost:27000/';
const lineData = require('../data/formatted-data-lines.json');
const stationData = require('../data/formatted-data-stations.json');

MongoClient.connect(
  URL,
  { useNewUrlParser: true },
)
  .then(async (db) => {
    const zehitomo = db.db('zehitomo');

    for (let i = 0; i < lineData.length; i++) {
      const line = lineData[i];

      const prefecturePromises = line.prefectureIds.map(id =>
        zehitomo.collection('location_prefectures').findOne({ name: id }),
      );

      const prefectures = await Promise.all(prefecturePromises).catch(
        (error) => {
          console.log('Prefecture promise rejected');
          console.log(error);
        },
      );

      line.prefectureIds = prefectures.map(prefecture => prefecture.id);
    }

    const linePromises = lineData.map(line =>
      zehitomo.collection('train_lines').insertOne(line),
    );

    await Promise.all(linePromises).catch((error) => {
      console.log('Line insertion failed');
      console.log(error);
    });

    const locationPromises = stationData.map(station =>
      zehitomo.collection('locations').findOne({ zipCode: station.zipCode }),
    );

    const locations = await Promise.all(locationPromises).catch((error) => {
      console.log('Location promise rejected');
      console.log(error);
    });

    for (let j = 0; j < locations.length; j++) {
      if (!locations[j]) {
        stationData[j].locationId = null;
      } else {
        stationData[j].locationId = locations[j]._id;
      }
    }

    const stationPromises = stationData.map(station =>
      zehitomo.collection('train_stations').insertOne(station),
    );

    await Promise.all(stationPromises).catch((error) => {
      console.log('Station insertion failed');
      console.log(error);
    });

    return db;
  })
  .then((db) => {
    db.close();
    console.log('Database closed!');
  });
