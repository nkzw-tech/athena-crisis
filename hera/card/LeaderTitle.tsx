import { Gender } from '@deities/athena/info/Unit.tsx';

export default function LeaderTitle({ gender }: { gender: Gender }) {
  return gender === 'male' ? (
    <fbt desc="Label for male leader name">Leader</fbt>
  ) : gender === 'female' ? (
    <fbt desc="Label for female leader name">Leader</fbt>
  ) : (
    <fbt desc="Label for unknown gender leader name">Leader</fbt>
  );
}
