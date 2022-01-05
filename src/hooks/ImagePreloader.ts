import { Team, Owner } from "../types";
import { ProcessedTeam } from "./ProcessedTeam";
import { isContext, isLayoutEffect } from "../magic/useMagicClass";
import { TimelineDataContext } from "./TimelineData";

export class ImagePreloader {
  @isContext(TimelineDataContext, (data) => data && data.team)
  private team: ProcessedTeam | null = null;

  constructor() {}

  public ownerToImageMap = new Map<
    Owner,
    { height: number; width: number; image: HTMLImageElement }
  >();

  @isLayoutEffect<ImagePreloader>(({ team }) => [team?.value])
  private async load() {
    const promises = [];

    for (let key in this.team!.value) {
      const owner = this.team!.value[key];

      if (
        owner?.avatar != null &&
        typeof owner?.avatar === "string" &&
        !this.ownerToImageMap.get(owner)
      ) {
        promises.push(
          new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
              this.ownerToImageMap.set(owner, {
                height: image.naturalHeight,
                image,
                width: image.naturalWidth,
              });

              resolve();
            };
            image.src = owner.avatar || "";
          })
        );
      }
    }

    await Promise.all(promises);
  }
}
