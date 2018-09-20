'use strict';

const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const writeJson = require('./utils/json/write');
const Kuroshiro = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

const data = require('../data/raw-data.json');
const kuroshiro = new Kuroshiro();

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

async function convertKanjiToHiragana () {
  await kuroshiro.init(new KuromojiAnalyzer());

  const kanji = await kuroshiro.convert('東京', {
    to: 'hiragana',
  });
  const romaji = await kuroshiro.convert('東京', {
    to: 'romaji',
    romajiSystem: 'passport',
  });

  console.log({ kanji, romaji });

  for (let i = 0; i < stations.length; i++) {
    const translation = await kuroshiro.convert(`${stations[i].name.ja}駅`, {
      to: 'hiragana',
    });

    original.forEach((prefecture) => {
      prefecture.lines.forEach((line) => {
        line.stations.forEach(async (station) => {
          if (station.id === stations[i].id) {
            // do the conversion
            station.name.hiragana = translation.slice(0, -2);
            console.log(
              `${i} ${stations[i].name.ja} => ${translation.slice(0, -2)}`,
            );
          }
        });
      });
    });
  }
  console.log('WRITING FILES');
  writeJson('./data/raw-data.json', original);
  console.log('DONE');
}

convertKanjiToHiragana();
