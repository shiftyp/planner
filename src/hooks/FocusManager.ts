import { isState, isLayoutEffect } from '../magic/useMagicClass';

export class FocusManager {
  @isState
  public isFocused: boolean = false

  private target: HTMLElement | null = null

  public setTarget = (target: HTMLElement | null) => {
    this.target = target
  }

  public focus = () => this.isFocused = true

  public blur = () => this.isFocused = false

  @isLayoutEffect<FocusManager>(({ isFocused }) => [isFocused])
  private doFocus() {
    if (this.isFocused && this.target) {
      this.target.focus();
    } 
  }

}