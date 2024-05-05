import Vector from '@deities/athena/map/Vector.tsx';
import dateNow from '@deities/hephaestus/dateNow.tsx';

let id = 0;

export default class AnimationKey extends Vector {
  private animationKeyId = `${dateNow().toString(36)}-${id++}`;

  constructor() {
    super(-1, -1);
  }

  override toString() {
    return this.animationKeyId;
  }

  override valueOf() {
    return this.animationKeyId;
  }
}
