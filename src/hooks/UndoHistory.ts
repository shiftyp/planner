import history from "history/browser";

import { isState } from "../magic/useMagicClass";
import { URLHistory } from './URLHistory';

export class UndoHistory {
  constructor(private urlHistory: URLHistory) {}

  public get currentIndex() {
    return this.urlHistory.state.index
  }

  @isState
  public maxIndex: number = 0;

  public saveSearch(newSearch: string) {
    this.maxIndex = this.currentIndex + 1

    this.urlHistory.saveSearch(newSearch, {
      index: this.maxIndex
    });
  }

  undo = () => {
    if (this.currentIndex > 0) {
      this.urlHistory.back()
    }
  }

  redo = () => {
    if (this.currentIndex < this.maxIndex) {
      this.urlHistory.forward()
    }
  }
}
