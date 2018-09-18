"use strict";

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const writeJson = require("./utils/json/write");

const data = require("../data/raw-data.json");
const errors = require("../data/raw-data-errors.json");
const index = require("../data/index.json");

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
      []
    )
  ],
  []
);

for (let i = index; i < stations.length; i++) {
  const request = new XMLHttpRequest();
  request.open(
    "GET",
    `https://ja.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${encodeURIComponent(
      `${stations[i].name.ja}駅`
    )}&lllang=en&formatversion=2&format=json`,
    false
  );
  request.send();

  if (request.status !== 200) {
    errors.push({
      station: stations[i].id,
      errorType: "Bad response",
      stationName: stations[i].name.ja,
      prefecture: stations[i].prefecture.name.ja
    });
    console.log(`Error getting ${stations[i].name.ja}`);
    continue;
  }

  const response = JSON.parse(request.responseText);

  if (!response.query.pages[0].langlinks) {
    errors.push({
      stationId: stations[i].id,
      errorType: "Page not found",
      stationName: stations[i].name.ja,
      prefecture: stations[i].prefecture.name.ja
    });
    console.log(`${i} Error finding ${stations[i].name.ja}`);
    continue;
  }

  const englishName = response.query.pages[0].langlinks[0].title;

  original.forEach((prefecture) => {
    prefecture.lines.forEach((line) => {
      line.stations.forEach((station) => {
        if (station.id === stations[i].id) {
          const englishNameSliced = englishName.slice(
            0,
            englishName.indexOf(" Station")
          );
          station.name.en = englishNameSliced;
          console.log(`${i} ${station.name.ja} => ${englishNameSliced}`);
        }
      });
    });
  });

  if (i % 100 === 0) {
    console.log("WRITING FILES");
    writeJson("./data/raw-data.json", original);
    writeJson("./data/index.json", i);
    writeJson("./data/raw-data-errors.json", errors);
    console.log("WRITE COMPLETE");
  }
}

console.log("WRITING FILES");
writeJson("./data/raw-data.json", original);
writeJson("./data/raw-data-errors.json", errors);
console.log("DONE");

// Try again on errors with 停留場
