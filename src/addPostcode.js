'use strict';

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const writeJson = require('./utils/json/write');

const data = require('../data/raw-data.json');

const original = JSON.parse(JSON.stringify(data));

// turn 'data' into a circular structure
data.forEach((prefecture) => {
  prefecture.lines.forEach((line) => {
    line.prefecture = prefecture;
    line.stations.forEach((station) => {
      station.prefecture = prefecture;
    });
  });
});

const stations = data.reduce(
  (reducedPrefectures, prefecture) => [
    ...reducedPrefectures,
    ...prefecture.lines.reduce(
      (reducedLines, line) => [...reducedLines, ...line.stations],
      [],
    ),
  ],
  [],
);

let stationsRemaining = 0;

original.forEach((prefecture, prefIdx) => {
  prefecture.lines.forEach((line, lineIdx) => {
    for (let i = 0; i < line.stations.length; i++) {
      const station = line.stations[i];
      if (!station.location.postalCode.ja) {
        stationsRemaining++;
      }
    }
  });
});

console.log(`${stationsRemaining} remaining.`);

original.forEach((prefecture, prefIdx) => {
  prefecture.lines.forEach((line, lineIdx) => {
    for (let i = 0; i < line.stations.length; i++) {
      const station = line.stations[i];
      if (!station.location.postalCode.ja) {
        const request = new XMLHttpRequest();
        request.open(
          'GET',
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${
            station.location.lat
          },${
            station.location.lng
          }&key=AIzaSyAkYRFVJP5oiphcDNKFLmSRZO-fbMORqLg`,
          false,
        );
        request.send();

        if (request.status !== 200) {
          console.log(
            `${prefIdx * lineIdx + i} Error getting ${station.name.ja}`,
          );
          continue;
        }

        const response = JSON.parse(request.responseText);

        let postalCode;

        response.results.forEach((result) => {
          result.address_components.forEach((address_component) => {
            if (address_component.types.includes('postal_code')) {
              postalCode = address_component.long_name.replace(/[^0-9]/g, '');
            }
          });
        });

        if (!postalCode) {
          console.log(
            `${prefIdx * lineIdx + i} Error finding ${station.name.ja}`,
          );
          continue;
        }

        station.location.postalCode.ja = postalCode;

        writeJson('./data/raw-data.json', original);
        console.log(
          `${--stationsRemaining} Added ${postalCode} to ${station.name.ja}`,
        );
      }
    }
  });
});
