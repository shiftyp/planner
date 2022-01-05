import { isMemo } from "../magic/useMagicClass";
import { Task, Team, CodeData } from "../types";
import { URLData } from './URLData';
import { stringifyObject, parseCode } from '../utils/parsing';

export class ProcessedTeam implements CodeData<Team>{

  constructor(private urlData: URLData) {
  }

  public get value() {
    return this.urlData.data.team
  }
  
  @isMemo<ProcessedTeam>(({ urlData }) => [urlData.data])
  public get string() {
    return stringifyObject(this.value);
  }

  public update = (team: string) => {
    try {
      this.urlData.update({ team: parseCode(team) as Team });
    } catch (e) {}
  }

  @isMemo<ProcessedTeam>(({ urlData }) => [urlData.data])
  public get namesArray() {
    const set = new Set<string>();

    for (let key in this.urlData.data.team) {
      const owner = this.urlData.data.team[key];
      const name = owner.name?.toLowerCase();

      if (name) {
        set.add(name);
      }
    }

    for (let taskIndex = 0; taskIndex < this.urlData.data.tasks.length; taskIndex++) {
      const task = this.urlData.data.tasks[taskIndex];
      const owner = this.urlData.data.team[task.owner];
      if (owner == null) {
        const ownerName = this.getOwnerName(task, this.urlData.data.team);
        set.add(ownerName);
      }
    }

    return Array.from(set);
  }

  @isMemo<ProcessedTeam>(({ urlData }) => [urlData.data])
  public get nameToAvatarMap() {
    const map = new Map<string, string>();

    for (let key in this.urlData.data.team) {
      const owner = this.urlData.data.team[key];
      const name = owner.name?.toLowerCase();

      if (name && owner.avatar) {
        map.set(name, owner.avatar);
      }
    }

    return map;
  }

  public getOwnerName(task: Task, team: Team) {
    const owner = team[task.owner];
    const ownerName = owner?.name || task.owner || "Team";
    return ownerName.toLowerCase();
  }
}
