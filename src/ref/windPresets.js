import { createWindLayer, DEFAULT_WIND_PARAMS, mergeWindParams } from '../utils/windCreator';

/** Soft randomized Wind stack for random mixes / moods. */
export function randomWindParams() {
  const layers = [
    createWindLayer({
      volume: 0.45 + Math.random() * 0.4,
      speed: 0.01 + Math.random() * 0.04,
      highpass: 200 + Math.random() * 800,
      lowpass: 4000 + Math.random() * 6000,
    }),
  ];
  if (Math.random() > 0.55) {
    layers.push(
      createWindLayer({
        volume: 0.25 + Math.random() * 0.35,
        speed: 0.02 + Math.random() * 0.05,
        highpass: 400 + Math.random() * 1200,
        lowpass: 5000 + Math.random() * 5000,
      })
    );
  }
  return mergeWindParams({ layers });
}

export function calmWindParams() {
  return mergeWindParams({
    layers: [
      createWindLayer({
        volume: 0.4,
        speed: 0.018,
        highpass: 500,
        lowpass: 7000,
      }),
    ],
  });
}

export function breezeWindParams() {
  return mergeWindParams({
    layers: [
      createWindLayer({
        volume: 0.35,
        speed: 0.03,
        highpass: 800,
        lowpass: 9000,
      }),
      createWindLayer({
        volume: 0.22,
        speed: 0.012,
        highpass: 200,
        lowpass: 3500,
      }),
    ],
  });
}

export { DEFAULT_WIND_PARAMS };
