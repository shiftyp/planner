import { isMemo } from "../magic/useMagicClass";
import { Task, CodeData } from "../types";
import {
  fromString,
  getIntervalLabel,
  getIntervalRange,
  getIntervalUnit,
} from "../utils/time";
import { URLData } from "./URLData";
import { stringifyObject, parseCode } from "../utils/parsing";
import { Temporal } from "@js-temporal/polyfill";

export class ProcessedTasks implements CodeData<Task[]> {
  constructor(private urlData: URLData) {}

  @isMemo<ProcessedTasks>(({ urlData }) => [urlData.data])
  public get string() {
    return stringifyObject(this.urlData.data.tasks);
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get taskToTemporalMap() {
    const taskToTemporalMap = new Map<
      Task,
      { start: Temporal.Instant; stop: Temporal.Instant }
    >();

    for (
      let taskIndex = 0;
      taskIndex < this.urlData.data.tasks.length;
      taskIndex++
    ) {
      const task = this.urlData.data.tasks[taskIndex];

      const taskStart = fromString(task.start);
      const taskStop = fromString(task.stop, "23:59:59");
      taskToTemporalMap.set(task, { start: taskStart, stop: taskStop });
    }

    return taskToTemporalMap;
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get value() {
    const tasks = this.urlData.data.tasks;

    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
      const task = tasks[taskIndex];

      const taskStart = fromString(task.start);
      const taskStop = fromString(task.stop, "23:59:59");

      let currentIndex = taskIndex - 1;

      while (currentIndex >= 0) {
        const currentTask = tasks[currentIndex];
        const { start: currentTaskStart, stop: currentTaskStop } =
          this.taskToTemporalMap.get(currentTask)!;

        let move = false;
        if (currentTask.id === task.dependency) {
          move = true;
        } else if (currentTask.dependency === task.dependency) {
          if (
            taskStart.epochMilliseconds > currentTaskStart.epochMilliseconds
          ) {
            move = true;
          } else if (
            taskStart.epochMilliseconds === currentTaskStart.epochMilliseconds
          ) {
            if (
              taskStop.epochMilliseconds < currentTaskStop.epochMilliseconds
            ) {
              move = true;
            } else if (!task.isOngoing && currentTask.isOngoing) {
              move = true;
            }
          }
        }

        if (move) {
          tasks.splice(taskIndex, 1);
          tasks.splice(currentIndex + 1, 0, task);
          break;
        } else {
          currentIndex--;
        }
      }
    }

    return tasks;
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get taskToIdMap() {
    const map = new Map<number | string, Task>();
    this.value.forEach((task) => {
      map.set(task.id, task);
    });

    return map;
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get dependenciesMap() {
    const map = new Map<Task, Task[]>();

    for (let taskIndex = 0; taskIndex < this.value.length; taskIndex++) {
      const task = this.value[taskIndex]!;

      if (task.dependency != null) {
        const dependencyId = task.dependency;
        const dependency = this.taskToIdMap.get(dependencyId);

        if (dependency == null) {
          console.warn(
            `Invalid dependency; no parent task found with id ${dependencyId}`
          );
        } else {
          if (!map.has(dependency)) {
            map.set(dependency, []);
          }
          map.get(dependency)!.push(task);
        }
      }
    }

    return map;
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get taskToRowIndexMap() {
    const map = new Map<Task, number>();
    const rows = [];

    for (let taskIndex = 0; taskIndex < this.value.length; taskIndex++) {
      const task = this.value[taskIndex];
      const { start: taskStart, stop: taskStop } =
        this.taskToTemporalMap.get(task)!;

      let nextAvailableRowIndex = -1;

      if (task.dependency == null && !task.isOngoing) {
        nextAvailableRowIndex = rows.findIndex((rowTasks) => {
          let match = true;

          for (
            let rowTaskIndex = 0;
            rowTaskIndex < rowTasks.length;
            rowTaskIndex++
          ) {
            const rowTask = rowTasks[rowTaskIndex];

            if (rowTask.isOngoing) {
              match = false;
              break;
            }

            if (rowTask.dependency != null) {
              match = false;
              break;
            }

            const { start: rowTaskStart, stop: rowTaskStop } =
              this.taskToTemporalMap.get(rowTask)!;

            if (
              taskStart.epochMilliseconds <= rowTaskStart.epochMilliseconds ||
              taskStop.epochMilliseconds >= rowTaskStop.epochMilliseconds
            ) {
              match = false;
              break;
            }
          }
          return match;
        });
      }

      const rowIndex: number =
        nextAvailableRowIndex >= 0 ? nextAvailableRowIndex : rows.length;
      if (rows[rowIndex] == null) {
        rows[rowIndex] = [task];
      } else {
        rows[rowIndex].push(task);
      }

      map.set(task, rowIndex);
    }

    return map;
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get intervalRange() {
    let minDate: Temporal.Instant | null = null;
    let maxDate: Temporal.Instant | null = null;

    for (const {
      start: taskStart,
      stop: taskStop,
    } of this.taskToTemporalMap.values()) {
      if (
        minDate === null ||
        minDate.epochMilliseconds > taskStart.epochMilliseconds
      ) {
        minDate = taskStart;
      }
      if (
        maxDate === null ||
        maxDate.epochMilliseconds < taskStop.epochMilliseconds
      ) {
        maxDate = taskStop;
      }
    }
    return getIntervalRange(minDate!, maxDate!);
  }

  public get startDate() {
    return this.intervalRange[0];
  }

  public get stopDate() {
    return this.intervalRange[this.intervalRange.length - 1];
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get unit() {
    return getIntervalUnit(this.startDate, this.stopDate);
  }

  @isMemo<ProcessedTasks>(({ string }) => [string])
  public get maxRowIndex() {
    let max = -1;

    for (const index of this.taskToRowIndexMap.values()) {
      max = index > max ? index : max;
    }

    return max + 1;
  }

  public update = (tasks: string) => {
    try {
      this.urlData.update({
        tasks: (parseCode(tasks) as Task[]).filter((task) => task != null),
      });
    } catch (e) {}
  };
}
