'use strict';

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const writeJson = require('./utils/json/write');

const data = require('../data/raw-data.json');
const oldErrors = require('../data/raw-data-errors.json');
const index = require('../data/index.json');
const newErrors = require('../data/raw-data-new-errors.json');

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

for (let i = index; i < oldErrors.length; i++) {
  if (i % 100 === 0) {
    console.log('WRITING FILES');
    writeJson('./data/raw-data.json', original);
    writeJson('./data/index.json', i);
    writeJson('./data/raw-data-new-errors.json', newErrors);
    console.log('WRITE COMPLETE');
  }

  const request = new XMLHttpRequest();
  request.open(
    'GET',
    `https://ja.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(
      `${oldErrors[i].stationName}停留場`,
    )}&lllang=en&formatversion=2&format=json`,
    false,
  );
  request.send();

  if (request.status !== 200) {
    newErrors.push({
      station: oldErrors[i].stationId,
      errorType: 'Bad response',
      stationName: oldErrors[i].stationName,
      prefecture: oldErrors[i].prefecture,
    });
    console.log(`Error getting ${oldErrors[i].stationName}`);
    continue;
  }

  const response = JSON.parse(request.responseText);

  if (!response.query.pages[0].langlinks) {
    newErrors.push({
      stationId: oldErrors[i].stationId,
      errorType: 'Page not found',
      stationName: oldErrors[i].stationName,
      prefecture: oldErrors[i].prefecture,
    });
    console.log(`${i} Error finding ${oldErrors[i].stationName}`);
    continue;
  }

  const englishName = response.query.pages[0].langlinks[0].title;

  original.forEach((prefecture) => {
    prefecture.lines.forEach((line) => {
      line.stations.forEach((station) => {
        if (station.id === oldErrors[i].stationId) {
          const englishNameSliced = englishName.slice(
            0,
            englishName.indexOf(' Station'),
          );
          station.name.en = englishNameSliced;
          console.log(`${i} ${station.name.ja} => ${englishNameSliced}`);
        }
      });
    });
  });
}

console.log('WRITING FILES');
writeJson('./data/raw-data.json', original);
writeJson('./data/raw-data-new-errors.json', newErrors);
console.log('DONE');

// Try again on errors with 停留場
