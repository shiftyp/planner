import { isMemo } from "../magic/useMagicClass";
// @ts-ignore
import { parse, stringify } from "jsurl2";

import { Data } from "../types";
import { URLHistory } from "./URLHistory";
import { UndoHistory } from './UndoHistory';

export class URLData {
  constructor(private undoHistory: UndoHistory, private urlHistory: URLHistory, initialData: Data) {
    this.update(initialData);
  }

  @isMemo<URLData>(({ urlHistory }) => [urlHistory.search])
  public get data() {
    return parse(this.urlHistory.search.substr(1)) as Data;
  }

  public async update(params: Partial<Data>) {
    this.undoHistory.saveSearch(
      `?${stringify({
        ...this.data,
        ...params,
      })}`
    );
  }
}
