export type Rating = Readonly<{
  mu: number;
  sigma: number;
}>;

export type EncodedRatings = ReadonlyArray<[userId: number, rating: Rating]>;

export type Ratings = ReadonlyMap<number, Rating>;

export function userToRating({
  skillMu: mu,
  skillSigma: sigma,
}: {
  skillMu: number;
  skillSigma: number;
}) {
  return { mu, sigma };
}

export function createRatings(user: { id: number; skillMu: number; skillSigma: number }): Ratings {
  return new Map([[user.id, userToRating(user)]]);
}
