import { createContext } from "react";

import { isMagic } from "../magic/useMagicClass";
import { URLData } from "./URLData";
import { Data } from "../types";
import { ProcessedTasks } from "./ProcessedTasks";
import { ProcessedTeam } from "./ProcessedTeam";
import { URLHistory } from "./URLHistory";
import { UndoHistory } from "./UndoHistory";

export const TimelineDataContext = createContext<TimelineData | null>(null);

export class TimelineData {
  @isMagic
  private urlHistory: URLHistory = new URLHistory();

  @isMagic
  public undoHistory: UndoHistory = new UndoHistory(this.urlHistory);

  @isMagic
  public data: URLData = new URLData(
    this.undoHistory,
    this.urlHistory,
    this.initialData
  );

  @isMagic
  public tasks: ProcessedTasks = new ProcessedTasks(this.data);

  @isMagic
  public team: ProcessedTeam = new ProcessedTeam(this.data);

  constructor(private initialData: Data) {}
}
