import { Howl } from "howler";

export function playShipSend() {
  new Howl({
    src: [`assets/sounds/send_ship${Math.floor(Math.random() * 2)}.wav`],
    volume: 0.5,
    rate: 1 + Math.random() * 0.4 - 0.2,
  }).play();
}

export function playCoin() {
  new Howl({
    src: [`assets/sounds/coin.wav`],
    volume: 0.5,
    rate: 1 + Math.random() * 0.4 - 0.2,
  }).play();
}

export function playStationMove() {
  new Howl({
    src: [`assets/sounds/move_station.wav`],
    volume: 0.5,
    rate: 1 + Math.random() * 0.4 - 0.2,
  }).play();
}

export function playBuild() {
  new Howl({
    src: [`assets/sounds/build.wav`],
    volume: 0.5,
    rate: 1 + Math.random() * 0.4 - 0.2,
  }).play();
}

export function playError() {
  new Howl({
    src: [`assets/sounds/error.wav`],
    volume: 0.5,
    rate: 1 + Math.random() * 0.2 - 0.1,
  }).play();
}

const loopSounds = ["assets/sounds/loop0.wav", "assets/sounds/loop1.wav"];

// play loop sounds
export let loopStopped = false;
let loop: Howl | null = null;
export function playLoop() {
  loop = new Howl({
    src: [loopSounds[Math.floor(Math.random() * loopSounds.length)]],
    volume: 0.15,
    rate: 1 + Math.random() * 0.4 - 0.2,
    onend: () => {
      if (loopStopped) return;
      playLoop();
    },
  });
  loop.play();
}
setTimeout(playLoop, 1000);

export function toggleLoop() {
  if (loop) {
    loopStopped = true;
    loop.stop();
    loop = null;
  } else {
    loopStopped = false;
    playLoop();
  }
}
