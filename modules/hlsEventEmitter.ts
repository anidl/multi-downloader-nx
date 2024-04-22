import EventEmitter from "events";
import { ProgressData } from "../@types/messageHandler";
import { Level } from "log4js";

type BaseEvent = {
  identifier: string
}

type ProgressEvent = ProgressData & BaseEvent

type MessageEvent = {
  msg: string,
  severity: Level
} & BaseEvent

type HLSEventTypes = {
  progress: (data: ProgressEvent) => unknown,
  message: (data: MessageEvent) => unknown,
  end: (data: BaseEvent) => unknown
}

declare interface HLSEventEmitter {
  on<T extends keyof HLSEventTypes>(event: T, listener: HLSEventTypes[T]): this;
  emit<T extends keyof HLSEventTypes>(event: T, data: Parameters<HLSEventTypes[T]>[0]): boolean;
}

class HLSEventEmitter extends EventEmitter {}

const eventHandler = new HLSEventEmitter();

export default eventHandler;
