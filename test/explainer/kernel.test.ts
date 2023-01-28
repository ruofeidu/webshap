import { describe, test, expect, beforeEach } from 'vitest';
import { KernelSHAP, IrisLinearBinary } from '../../src/index';
import { randomLcg, randomUniform } from 'd3-random';
import math from '../../src/utils/math-import';
import type { SHAPModel } from '../../src/my-types';

interface LocalTestContext {
  model: SHAPModel;
  data: number[][];
}

/**
 * Initialize the fixture for all tests
 */
beforeEach<LocalTestContext>(context => {
  const coef = [-0.1991, 0.3426, 0.0478, 1.03745];
  const intercept = -1.6689;
  const model = new IrisLinearBinary(coef, intercept);
  context.model = (x: number[][]) => model.predictProba(x);
  context.data = [
    [5.8, 2.8, 5.1, 2.4],
    [5.8, 2.7, 5.1, 1.9],
    [7.2, 3.6, 6.1, 2.5],
    [6.2, 2.8, 4.8, 1.8],
    [4.9, 3.1, 1.5, 0.1]
  ];
});

test<LocalTestContext>('constructor()', ({ model, data }) => {
  const yPredProbaExp = [
    0.7045917, 0.57841617, 0.73422101, 0.53812833, 0.19671004
  ];
  const explainer = new KernelSHAP(model, data, 0.20071022);

  for (const [i, pred] of explainer.predictions.entries()) {
    expect(pred).toBeCloseTo(yPredProbaExp[i], 6);
  }
});

test<LocalTestContext>('prepareSampling()', ({ model, data }) => {
  const explainer = new KernelSHAP(model, data, 0.20071022);
  const nSamples = 14;
  explainer.prepareSampling(nSamples);

  // The sample data should be initialized to repeat x_test
  const sampledData = explainer.sampledData!;
  expect(sampledData.size()[0]).toBe(nSamples * data.length);
  expect(sampledData.subset(math.index(0, 0))).toBe(data[0][0]);
  expect(sampledData.subset(math.index(data.length, 1))).toBe(data[0][1]);
  expect(sampledData.subset(math.index(sampledData.size()[0] - 1, 2))).toBe(
    data[data.length - 1][2]
  );
});

test<LocalTestContext>('sampleFeatureCoalitions()', ({ model, data }) => {
  const explainer = new KernelSHAP(model, data, 0.20071022);
  const nSamples = 14;

  const result = math.matrix([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]);
  // console.log(math.row(result, 1));
  // console.log(result.subset(math.index(1, math.range(0, 3))));
  // console.log(result);
});

test<LocalTestContext>('addSample() basic', ({ model, data }) => {
  const explainer = new KernelSHAP(model, data, 0.20071022);
  const nSamples = 14;

  // Initialize the sample data
  explainer.prepareSampling(nSamples);

  // Test adding a sample
  const x1 = [4.8, 3.8, 2.1, 5.4];
  const mask1 = [1.0, 0.0, 1.0, 0.0];
  const weight1 = 0.52;
  explainer.addSample(x1, mask1, weight1);
  const sampledData = explainer.sampledData!;

  // Only the first and their elements are changed from the background
  for (let i = 0; i < data.length; i++) {
    const row = math.row(sampledData, i).toArray()[0];
    const rowExp = [x1[0], data[i][1], x1[2], data[i][3]];
    expect(row).toEqual(rowExp);
  }

  // Test if all other repetitions of the background data remain the same
  for (let i = 1; i < nSamples; i++) {
    for (let j = 0; j < data.length; j++) {
      const row = math.row(sampledData, i * data.length + j).toArray()[0];
      expect(row).toEqual(data[j]);
    }
  }

  // Test tracking variables
  expect(explainer.kernelWeight!.get([0, 0])).toBe(weight1);
  expect(explainer.nSamplesAdded).toBe(1);
});

test<LocalTestContext>('addSample() more complex', ({ model, data }) => {
  const explainer = new KernelSHAP(model, data, 0.20071022);
  const nSamples = 14;

  // Initialize the sample data
  explainer.prepareSampling(nSamples);

  // Test adding a sample
  const x1 = [4.8, 3.8, 2.1, 5.4];
  const mask1 = [1.0, 0.0, 1.0, 0.0];
  const weight1 = 0.52;
  explainer.addSample(x1, mask1, weight1);

  const x2 = [11.2, 11.2, 11.2, 11.2];
  const mask2 = [1.0, 1.0, 0.0, 1.0];
  const weight2 = 0.99;
  explainer.addSample(x2, mask2, weight2);

  const sampledData = explainer.sampledData!;

  // The first repetition should match x_1 and mask_1
  for (let i = 0; i < data.length; i++) {
    const row = math.row(sampledData, i).toArray()[0];
    const rowExp = [x1[0], data[i][1], x1[2], data[i][3]];
    expect(row).toEqual(rowExp);
  }

  // The second repetition should match x_2 and mask_2
  for (let i = 0; i < data.length; i++) {
    const r = data.length + i;
    const row = math.row(sampledData, r).toArray()[0];
    const rowExp = [x2[0], x2[1], data[i][2], x2[3]];
    expect(row).toEqual(rowExp);
  }

  // Test if all other repetitions of the background data remain the same
  for (let i = 2; i < nSamples; i++) {
    for (let j = 0; j < data.length; j++) {
      const row = math.row(sampledData, i * data.length + j).toArray()[0];
      expect(row).toEqual(data[j]);
    }
  }

  // Test tracking variables
  expect(explainer.kernelWeight!.get([1, 0])).toBe(weight2);
  expect(explainer.nSamplesAdded).toBe(2);
});
