'use strict';

const writeJson = require('./utils/json/write');

const data = require('../data/raw-data.json');

const reformatted = [];

data.forEach((prefecture) => {
  prefecture.lines.forEach((line) => {
    // remove zoom
    line.prefectureIds = prefecture.name.ja;
    delete line.zoom;
    delete line.lat;
    delete line.lng;
    line.id = line.id.toString();
    line._id = line.id;
    // delete location stuff from each station
    line.stations.forEach((station) => {
      station.id = station.id.toString();
      station._id = station.id;
      delete station.gid;
      station.lat = station.location.lat;
      station.lng = station.location.lng;
      station.zipCode = station.location.postalCode.ja.replace(/[^0-9]/g, '');
      delete station.location;
      station.lines = station.lines.map(line => line.id.toString());
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

const linesToStations = {};

reformatted.forEach((line) => {
  line.stations.forEach((station) => {
    if (linesToStations.hasOwnProperty(line.id)) {
      linesToStations[line.id].push(station.id.toString());
    } else {
      linesToStations[line.id] = [station.id.toString()];
    }
  });
});

const deduplicatedStationIds = new Set();
const stations = [];

reformatted.forEach((line) => {
  line.stations.forEach((station) => {
    deduplicatedStationIds.add(station.id);
    stations.push(station);
  });
});

const deduplicatedStations = Array.from(deduplicatedStationIds).map(id =>
  stations.find(station => station.id === id),
);

reformatted.forEach((line) => {
  line.stations = linesToStations[line.id];
});

const deduplicatedLines = reformatted.filter(line => !line.delete);

writeJson('./data/formatted-data-lines.json', deduplicatedLines);
writeJson('./data/formatted-data-stations.json', deduplicatedStations);
