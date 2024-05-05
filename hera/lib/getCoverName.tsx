import { fbt } from 'fbt';

const getCover = (cover: number) => {
  if (cover === Number.POSITIVE_INFINITY) {
    return null;
  }
  if (cover < 0) {
    return 0;
  }
  if (cover < 10) {
    return 1;
  }
  if (cover < 20) {
    return 2;
  }
  if (cover < 30) {
    return 3;
  }
  return 4;
};

export default function getCoverName(cover: number) {
  const id = getCover(cover);
  return id != null
    ? [
        fbt('None', 'No cover'),
        fbt('Bad', 'Bad cover'),
        fbt('Normal', 'Normal cover'),
        fbt('Good', 'Good cover'),
        fbt('Great', 'Great cover'),
      ][id]
    : null;
}
