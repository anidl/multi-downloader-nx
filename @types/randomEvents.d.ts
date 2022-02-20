import { ExtendedProgress } from './messageHandler';

export type RandomEvents = {
  progress: ExtendedProgress,
  finish: undefined
}

export interface RandomEvent<T extends keyof RandomEvents> {
  name: T,
  data: RandomEvents[T]
}

export type Handler<T extends keyof RandomEvents> = (data: RandomEvent<T>) => unknown;