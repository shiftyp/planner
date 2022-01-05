import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import Planner from "./Planner";
import CodeEditor from "./CodeEditor";
import Header from "./Header";

import { team as initialTeam, tasks as initialTasks } from "./data"

import { TimelineData, TimelineDataContext } from "./hooks/TimelineData";
// @ts-ignore
import styles from "./App.module.css";
import { useMagicClass } from "./magic/useMagicClass";

const initialData = { team: initialTeam, tasks: initialTasks }

export default function App() {
  const timelineData = useMagicClass(
    () => new TimelineData(initialData)
  );

  const resetError = () => {
    timelineData.data.update(initialData);
  }

  return (
    <div className={styles.App}>
      <TimelineDataContext.Provider value={timelineData}>
        <Header />

        <div className={styles.ChartContainer}>
          <AutoSizer disableHeight>
            {({ width }) => (
              <Planner
                resetError={resetError}
                width={width}
              />
            )}
          </AutoSizer>
        </div>

        <div className={styles.CodeContainer}>
          <div className={styles.CodeColumnLeft}>
            <CodeEditor
              data={timelineData.tasks}
              label="Tasks"
              testName="tasks"
            />
          </div>
          <div className={styles.CodeColumnRight}>
            <CodeEditor
              data={timelineData.team}
              label="Team"
              testName="team"
            />
          </div>
        </div>
      </TimelineDataContext.Provider>
      </div>
  );
}
