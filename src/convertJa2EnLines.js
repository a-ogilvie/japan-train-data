'use strict';

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const writeJson = require('./utils/json/write');

const data = require('../data/raw-data.json');
const errors = require('../data/raw-data-errors-lines.json');
const index = require('../data/index.json');

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

const lines = data.reduce(
  (reducedPrefectures, prefecture) => [
    ...reducedPrefectures,
    ...prefecture.lines,
  ],
  [],
);

for (let i = index; i < lines.length; i++) {
  const line = lines[i];

  const request = new XMLHttpRequest();
  request.open(
    'GET',
    `https://ja.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(
      `${line.name.ja.replace('JR', '')}`,
    )}&lllang=en&formatversion=2&format=json`,
    false,
  );
  request.send();

  if (request.status !== 200) {
    errors.push({
      lineId: line.id,
      errorType: 'Bad response',
      lineName: line.name.ja,
      prefecture: line.prefecture.name.ja,
    });
    console.log(`Error getting ${line.name.ja}`);
    continue;
  }

  const response = JSON.parse(request.responseText);

  if (!response.query.pages[0].langlinks) {
    errors.push({
      lineId: line.id,
      errorType: 'Page not found',
      lineName: line.name.ja,
      prefecture: line.prefecture.name.ja,
    });
    console.log(`${i} Error finding ${line.name.ja}`);
    continue;
  }

  let englishName = response.query.pages[0].langlinks[0].title;

  if (line.name.ja.includes('JR')) {
    englishName = 'JR ' + englishName;
  }

  original.forEach((prefecture) => {
    prefecture.lines.forEach((originalLine) => {
      if (originalLine.id === line.id) {
        originalLine.name.en = englishName;
        console.log(`${i} ${line.name.ja} => ${englishName}`);
      }
    });
  });

  if (i % 100 === 0) {
    console.log('WRITING FILES');
    writeJson('./data/raw-data.json', original);
    writeJson('./data/index.json', i);
    writeJson('./data/raw-data-errors.json', errors);
    console.log('WRITE COMPLETE');
  }
}

console.log('WRITING FILES');
writeJson('./data/raw-data.json', original);
writeJson('./data/raw-data-errors-lines.json', errors);
console.log('DONE');

// Try again on errors with 停留場
