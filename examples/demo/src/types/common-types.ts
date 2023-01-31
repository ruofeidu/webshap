/**
 * Common types.
 */

type FeatureType = 'cont' | 'cat';

export interface TabularContFeature {
  name: string;
  displayName: string;
  desc: string;
  value: number;
}

export interface TabularCatFeature {
  name: string;
  displayName: string;
  desc: string;
  levelInfo: {
    [key: string]: [string, string];
  };
  value: string;
}

export interface TabularData {
  xTrain: number[][];
  yTrain: number[];
  xTest: number[][];
  yTest: number[];
  featureNames: string[];
  featureTypes: FeatureType[];
  featureInfo: { [key: string]: [string, string] };
  featureLevelInfo: {
    [key: string]: {
      [key: string]: [string, string];
    };
  };
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
