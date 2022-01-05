import history from "history/browser";
import { isState } from '../magic/useMagicClass';

export class URLHistory {
  @isState
  public search: string = ''
  @isState
  public state: { index: number } = { index: 0 }

  constructor() {
    this.listen()
  }

  protected async listen() {
    for await (const [search, state] of this.history) {
      this.search = search
      this.state = state
    }
  }

  private async *makeHistory() {
    while (true) {
      yield new Promise<[string, { index: number }]>((resolve) => {
        const unlisten = history.listen(() => {
          unlisten();
          resolve([history.location.search, history.location.state as { index: number }]);
        });
      });
    }
  }

  public history = this.makeHistory()

  public saveSearch(newSearch: string, state: { index: number }) {
    let prevSearch = history.location.search;
    if (prevSearch) {
      // Remove the leading "?"
      prevSearch = prevSearch.substr(1);

      // Nested apostrophes are auto escaped by the "history" library,
      // e.g. "jsurl2" serializes `team's` to `team*"s` which "history" converts to `team*%22s`.
      // We need to manually undo this conversion before comparing new search strings to current ones.
      prevSearch = prevSearch.replace(/\*%22/g, '*"');

      // Don't push a new History entry if the search string hasn't changed.
      if (prevSearch === newSearch) {
        return;
      }
    }

    this.search = newSearch
    this.state = state

    history.push({ search: newSearch }, state);
  }

  public back = () => history.back()
  public forward = () => history.forward()
}
