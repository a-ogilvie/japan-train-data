"use strict";

const writeJson = require("./utils/json/write");

const data = require("../data/raw-data.json");

const reformatted = [];

data.forEach((prefecture) => {
  prefecture.lines.forEach((line) => {
    // remove zoom
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
      station.lines.forEach((line) => {
        delete line.name;
      });
    });
    reformatted.push(JSON.parse(JSON.stringify(line)));
  });
});

reformatted.forEach((line) => {
  line.stations.forEach((station, i) => {
    if (/[^0-9a-zA-ZāōŌūŪ <>()-.'/]/.test(station.name.en)) {
      console.log(
        `${station.id} ${station.prefecture.en} ${station.name.ja} ${
          station.name.en
        } ${station.lat} ${station.lng}`
      );
    }
  });
});

writeJson("./data/formatted-data.json", reformatted);
