import {
  isContext,
  isLayoutEffect,
  isState,
  isMagic,
  isMemo,
} from "../magic/useMagicClass";
import { TimelineDataContext, TimelineData } from "./TimelineData";
import { useLayoutEffect, useMemo } from "react";
import { Temporal } from "@js-temporal/polyfill";

import {
  ARROW_SIZE,
  AVATAR_SIZE,
  BLACK,
  BLACK_TRANSPARENT,
  CORNER_RADIUS,
  DARK_GRAY,
  HEADER_HEIGHT,
  LIGHT_GRAY,
  LINE_SEGMENT_MIN_LENGTH,
  LINE_WIDTH,
  MARGIN,
  SLATE_GRAY,
  TASK_BAR_HEIGHT,
  TASK_ROW_HEIGHT,
  WHITE,
} from "../config";

import { Task } from "../types";
import { ImagePreloader } from './ImagePreloader';
import { getIntervalLabel } from '../utils/time';
import { getColorForString, getContrastRatio } from '../utils/color';

const VERTICAL_TEXT_OFFSET = 1

export class CanvasRenderer {
  constructor(private preloader: ImagePreloader, width: number) {
    this.width = width
  }

  @isState
  private canvas: HTMLCanvasElement | null = null;

  public setCanvas = (canvas: HTMLCanvasElement | null) => {
    this.canvas = canvas
  }

  @isMemo<CanvasRenderer>(({ canvas }) => [canvas])
  private get context() {
    return this.canvas?.getContext("2d")!;
  }

  @isMemo<CanvasRenderer>(({ canvas }) => [canvas])
  public get textDOMRects() {
    return new Map<string, DOMRect>()
  }

  @isContext(TimelineDataContext)
  private timelineData: TimelineData | null = null;

  public width: number = 0

  @isMemo<CanvasRenderer>(({ timelineData }) => [timelineData?.tasks?.maxRowIndex])
  public get height() {
    return HEADER_HEIGHT + this.timelineData?.tasks?.maxRowIndex! * TASK_ROW_HEIGHT;
  }

  @isLayoutEffect<CanvasRenderer>(({ height, width, canvas, timelineData }) => [
    canvas,
    height,
    width,
    timelineData?.data.data
  ])
  private render() {
    if (!this.context) return;
    
    const canvas = this.canvas!;
    const { width, height } = this

    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    this.context.scale(scale, scale);
    this.context.clearRect(0, 0, width, height);

    // Draw background grid first.
    // This marks off months and weeks.
    this.drawUnitGrid();

    // Render header text for month columns.
    this.drawUnitHeaders();

    for (
      let taskIndex = 0;
      taskIndex < this.timelineData!.tasks.value.length;
      taskIndex++
    ) {
      this.drawTaskRow(taskIndex);
    }

    // Draw arrows between dependencies.
    this.timelineData!.tasks.dependenciesMap.forEach(
      (dependentTasks, parentTask) => {
        this.drawDependencyConnections(dependentTasks, parentTask);
      }
    );
  }

  @isMemo<CanvasRenderer>(({ width, height, timelineData }) => [
    width,
    height,
    timelineData?.tasks.intervalRange,
  ])
  private get intervalWidth() {
    let intervalWidth = 0;

    if (this.timelineData!.tasks.intervalRange.length === 1) {
      intervalWidth = this.width;
    } else if (this.timelineData!.tasks.intervalRange.length > 1) {
      const x0 = this.getDateLocation(
        this.timelineData!.tasks.intervalRange[0]
      );
      const x1 = this.getDateLocation(
        this.timelineData!.tasks.intervalRange[1]
      );
      intervalWidth = x1 - x0;
    }
    if (intervalWidth <= 0 && this.timelineData!.tasks.intervalRange.length > 1) {
      throw Error(`Invalid interval width ${intervalWidth}`);
    }
    return intervalWidth;
  }

  private getDateLocation(date: Temporal.Instant) {
    const dateRangeDelta =
      this.timelineData!.tasks.stopDate.epochMilliseconds -
      this.timelineData!.tasks.startDate.epochMilliseconds;
    const offset = Math.max(
      0,
      Math.min(
        1,
        (date.epochMilliseconds -
          this.timelineData!.tasks.startDate.epochMilliseconds) /
          dateRangeDelta
      )
    );

    return this.width * offset;
  }

  private getTaskRect(task: Task) {
    const rowIndex = this.timelineData!.tasks.taskToRowIndexMap.get(task)!;
    const { start, stop } =
      this.timelineData!.tasks.taskToTemporalMap.get(task)!;

    const x = this.getDateLocation(start);
    const y = HEADER_HEIGHT + MARGIN + rowIndex * TASK_ROW_HEIGHT;
    const width = this.getDateLocation(stop) - x;
    const height = TASK_ROW_HEIGHT;

    return new DOMRect(x, y, width, height);
  }

  private getBarRect(taskRect: DOMRect) {
    return new DOMRect(
      taskRect.x,
      taskRect.y + taskRect.height - TASK_BAR_HEIGHT - MARGIN,
      taskRect.width,
      TASK_BAR_HEIGHT
    );
  }

  private getAvatarRect(taskRect: DOMRect) {
    return new DOMRect(
      taskRect.x,
      taskRect.y + MARGIN,
      AVATAR_SIZE,
      AVATAR_SIZE
    );
  }

  private getTextRect(taskRect: DOMRect) {
    const width = taskRect.width - AVATAR_SIZE - MARGIN;
    const height = AVATAR_SIZE;
    const x = taskRect.x + AVATAR_SIZE + MARGIN;
    const y = taskRect.y + MARGIN;

    return new DOMRect(x, y, width, height);
  }

  private drawOwnerAvatar(
    taskRect: DOMRect,
    ownerName: string,
    color: string,
    avatar: any
  ) {
    const avatarRect = this.getAvatarRect(taskRect);

    if (avatar?.image) {
      this.drawAvatarCircle(avatar, avatarRect.x, avatarRect.y, AVATAR_SIZE);
    } else {
      const character = ownerName.charAt(0).toUpperCase();

      this.drawRoundedRect(
        avatarRect.x,
        avatarRect.y,
        avatarRect.width,
        avatarRect.height,
        AVATAR_SIZE / 2
      );
      this.context!.fillStyle = color;
      this.context!.fill();

      this.context.font = "bold 15px sans-serif";
      this.context.fillStyle =
        getContrastRatio(color, WHITE) >
        getContrastRatio(color, BLACK)
          ? WHITE
          : BLACK;
      this.drawTextToCenterWithin(
        character,
        avatarRect.x,
        avatarRect.y,
        avatarRect.width,
        avatarRect.height
      );
    }
  }

  private drawTaskText(
    task: Task,
    taskRect: DOMRect,
  ) {
    const textRect = this.getTextRect(taskRect);

    this.context.font = "11px sans-serif";
    this.context.fillStyle = DARK_GRAY;

    const measuredTextWidth = this.drawTextToFitWidth(
      task.name,
      textRect.x,
      textRect.y,
      textRect.width,
      textRect.height
    );

    if (measuredTextWidth !== null) {
      this.textDOMRects.set(
        task.name,
        new DOMRect(textRect.x, textRect.y, measuredTextWidth, textRect.height)
      );
    } else {
      this.textDOMRects.set(
        task.name,
        new DOMRect(textRect.x, textRect.y, textRect.width, textRect.height)
      );
    }
  }

  private drawTaskBar(
    task: Task,
    taskRect: DOMRect,
    color: string,
  ) {
    const barRect = this.getBarRect(taskRect);

    if (task.isOngoing) {
      this.drawRoundedRect(
        barRect.x,
        barRect.y,
        this.width - barRect.x,
        barRect.height,
        CORNER_RADIUS
      );
      this.context.fillStyle = BLACK_TRANSPARENT;
      this.context.fill();

      const intervalWidth = this.intervalWidth
      const chunkCount = Math.round((this.width - barRect.x) / intervalWidth);
      const chunkWidth = barRect.width / chunkCount;

      for (
        let chunkX = barRect.x;
        chunkX < this.width;
        chunkX += intervalWidth
      ) {
        this.drawRoundedRect(
          chunkX,
          barRect.y,
          Math.min(chunkWidth, this.width - chunkX),
          barRect.height,
          CORNER_RADIUS
        );
        this.context.fillStyle = color;
        this.context.fill();
      }
    } else {
      this.drawRoundedRect(
        barRect.x,
        barRect.y,
        barRect.width - MARGIN,
        barRect.height,
        CORNER_RADIUS
      );
      this.context.fillStyle = color;
      this.context.fill();
    }
  }

  private drawTaskRow(
    taskIndex: number,
  ) {
    const task = this.timelineData!.tasks.value[taskIndex];
    const taskRect = this.getTaskRect(task);

    const ownerName = this.timelineData?.team.getOwnerName(task, this.timelineData!.team.value)!;
    const color = getColorForString(ownerName);
    const owner = this.timelineData?.team.value[task.owner];
    const avatar = this.preloader.ownerToImageMap.get(owner!);

    this.drawOwnerAvatar(taskRect, ownerName, color, avatar);
    this.drawTaskText(task, taskRect);
    this.drawTaskBar(task, taskRect, color);
  }

  private drawUnitGrid(
  ) {
    for (let index = 0; index < this.timelineData!.tasks.intervalRange.length - 1; index++) {
      const date = this.timelineData!.tasks.intervalRange[index];

      const x = this.getDateLocation(date);
      const y = HEADER_HEIGHT + MARGIN;

      this.context.beginPath();
      this.context.strokeStyle = LIGHT_GRAY;
      this.context.lineWidth = LINE_WIDTH;
      this.context.moveTo(x, y);
      this.context.lineTo(x, this.height);
      this.context.stroke();
    }
  }

  private drawUnitHeaders(
  ) {
    const intervalWidth = this.intervalWidth;

    for (let index = 0; index < this.timelineData!.tasks.intervalRange.length - 1; index++) {
      const date = this.timelineData!.tasks.intervalRange[index];

      const x = this.getDateLocation(date);
      const y = MARGIN;
      const width = intervalWidth;
      const height = HEADER_HEIGHT;

      const text = getIntervalLabel(date, this.timelineData!.tasks.unit);

      this.context.font = "bold 13px sans-serif";
      this.context.fillStyle = DARK_GRAY;
      this.drawTextToFitWidth(text, x, y, width, height);
    }
  }

  private drawDependencyConnections(
    dependentTasks: Task[],
    parentTask: Task
  ) {
    let firstTask = null;
    let lowestTask = null;

    for (let i = 0; i < dependentTasks.length; i++) {
      const dependantTask = dependentTasks[i];

      if (firstTask === null) {
        firstTask = dependantTask;
      } else if (firstTask.start > dependantTask.start) {
        firstTask = dependantTask;
      }

      if (lowestTask === null) {
        lowestTask = dependantTask;
      } else if (
        this.timelineData!.tasks.taskToRowIndexMap.get(lowestTask)! <
        this.timelineData!.tasks.taskToRowIndexMap.get(dependantTask)!
      ) {
        lowestTask = dependantTask;
      }
    }

    if (firstTask == null || lowestTask == null) {
      return;
    }

    const firstBarRect = this.getBarRect(
      this.getTaskRect(firstTask)
    );
    const lowestBarRect = this.getBarRect(
      this.getTaskRect(lowestTask)
    );
    const parentBarRect = this.getBarRect(
      this.getTaskRect(parentTask)
    );

    const x = Math.max(
      parentBarRect.x + MARGIN,
      Math.min(
        firstBarRect.x - LINE_SEGMENT_MIN_LENGTH - MARGIN,
        // Ideal target alignment:
        parentBarRect.x + parentBarRect.width / 2
      )
    );

    const y0 = parentBarRect.y + parentBarRect.height + MARGIN;
    const y1 = lowestBarRect.y + lowestBarRect.height / 2;

    // Draw vertical line from parent task down.
    // This assumes that each sub-task is on its own row.
    // TODO Verify that and draw multiple vertical connecting lines if necessary.
    this.context.beginPath();
    this.context.strokeStyle = SLATE_GRAY;
    this.context.lineWidth = LINE_WIDTH;
    this.context.moveTo(x, y0);
    this.context.lineTo(x, y1);
    this.context.stroke();

    // Draw horizontal lines (with arrows) to connect each dependent task.
    for (let i = 0; i < dependentTasks.length; i++) {
      const dependantTask = dependentTasks[i];
      const dependantBarRect = this.getBarRect(
        this.getTaskRect(dependantTask)
      );

      const x0 = x;
      const x1 = dependantBarRect.x - MARGIN;
      const y = dependantBarRect.y + dependantBarRect.height / 2;

      this.context.beginPath();
      this.context.strokeStyle = SLATE_GRAY;
      this.context.lineWidth = LINE_WIDTH;
      this.context.moveTo(x0, y);
      this.context.lineTo(x1, y);
      this.context.moveTo(x1, y);
      this.context.lineTo(x1 - ARROW_SIZE / 3, y - ARROW_SIZE / 3);
      this.context.moveTo(x1, y);
      this.context.lineTo(x1 - ARROW_SIZE / 3, y + ARROW_SIZE / 3);
      this.context.stroke();
    }
  }

 private drawTextToFitWidth(text: string, x: number, y: number, width: number, height: number) {
  let resizedText = false;

  let textToRender = text;
  let textWidth = this.context.measureText(textToRender).width;
  if (textWidth > width) {
    resizedText = true;

    while (textWidth >= width && textToRender.length > 1) {
      textToRender = textToRender.substring(0, textToRender.length - 2) + "…";
      textWidth = this.context.measureText(textToRender).width;
    }
  }

  this.context.textBaseline = "middle";
  this.context.fillText(
    textToRender,
    x,
    y + height / 2 + VERTICAL_TEXT_OFFSET,
    width
  );

  return resizedText ? textWidth : null;
}

 private drawTextToCenterWithin(text: string, x: number, y: number, width: number, height: number) {
  const textWidth = this.context.measureText(text).width;

  this.context.textBaseline = "middle";
  this.context.fillText(
    text,
    x + width / 2 - textWidth / 2,
    y + height / 2 + VERTICAL_TEXT_OFFSET,
    textWidth
  );
}

// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
 private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
  this.context.beginPath();
  this.context.moveTo(x + radius, y);
  this.context.arcTo(x + width, y, x + width, y + height, radius);
  this.context.arcTo(x + width, y + height, x, y + height, radius);
  this.context.arcTo(x, y + height, x, y, radius);
  this.context.arcTo(x, y, x + width, y, radius);
  this.context.closePath();
}

 private drawAvatarCircle(avatar: any, x: number, y: number, size: number) {
  this.context.save();
  this.context.beginPath();
  this.drawRoundedRect(x, y, size, size, size / 2);
  this.context.closePath();
  this.context.clip();

  this.context.drawImage(
    avatar.image,

    // Native image coordinates and size
    0,
    0,
    avatar.width,
    avatar.height,

    // Canvas coordinates and scaled image size
    x,
    y,
    size,
    size
  );

  this.context.restore();
}

}
