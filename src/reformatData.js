"use strict";

const writeJson = require("./utils/json/write");

const data = require("../data/raw-data.json");

const reformatted = [];

data.forEach((prefecture) => {
  prefecture.lines.forEach((line) => {
    // remove zoom
    line.prefectureIds = prefecture.name.ja;
    delete line.zoom;
    delete line.lat;
    delete line.lng;
    line.id = line.id.toString();
    // delete location stuff from each station
    line.stations.forEach((station) => {
      delete station.gid;
      station.lat = station.location.lat;
      station.lng = station.location.lng;
      station.zipCode = station.location.postalCode.ja.replace(/[^0-9]/g, "");
      delete station.location;
      const lineIds = [];
      station.lines.forEach((line) => {
        lineIds.push(line.id);
      });
      station.lines = lineIds;
    });
    reformatted.push(JSON.parse(JSON.stringify(line)));
  });
});

const idsToPrefectures = {};

reformatted.forEach((line) => {
  if (idsToPrefectures.hasOwnProperty(line.id)) {
    idsToPrefectures[line.id].push(line.prefectureIds);
  } else {
    idsToPrefectures[line.id] = [line.prefectureIds];
  }
});

const duplicates = new Set();

reformatted.forEach((line) => {
  if (duplicates.has(line.id)) {
    line.delete = true;
  } else {
    duplicates.add(line.id);
    line.prefectureIds = idsToPrefectures[line.id];
  }
});

const deduplicated = reformatted.filter((line) => !line.delete);

writeJson("./data/formatted-data.json", deduplicated);

// reformatted.forEach((line) => {
//   line.stations.forEach((station, i) => {
//     if (/[^0-9a-zA-ZāōŌūŪ <>()-.'/]/.test(station.name.en)) {
//       console.log(
//         `${station.id} ${station.prefecture.en} ${station.name.ja} ${
//           station.name.en
//         } ${station.lat} ${station.lng}`
//       );
//     }
//   });
// });
