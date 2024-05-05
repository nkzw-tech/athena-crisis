import Vector from './Vector.tsx';

export default class SpriteVector extends Vector {
  override up(n = 1): SpriteVector {
    return new SpriteVector(this.x, this.y - n);
  }
  override right(n = 1): SpriteVector {
    return new SpriteVector(this.x + n, this.y);
  }
  override down(n = 1): SpriteVector {
    return new SpriteVector(this.x, this.y + n);
  }
  override left(n = 1): SpriteVector {
    return new SpriteVector(this.x - n, this.y);
  }
  override hashCode() {
    return this.id;
  }
}
