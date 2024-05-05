/* eslint-disable @deities/require-fbt-description */
import { isValidElement, ReactElement, ReactNode } from 'react';

export const Conjunctions = {
  AND: 'AND',
  NONE: 'NONE',
  OR: 'OR',
} as const;

export const Delimiters = {
  BULLET: 'BULLET',
  COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON',
} as const;

type Conjunction = keyof typeof Conjunctions;
type Delimiter = keyof typeof Delimiters;

export default function intList(
  items: ReadonlyArray<string | ReactElement>,
  conjunction: Conjunction,
  delimiter: Delimiter,
): ReactNode {
  if (process.env.NODE_ENV === 'development') {
    items.forEach((item) => {
      if (typeof item !== 'string' && !isValidElement(item)) {
        throw new Error('Must provide a string or ReactComponent to intlList.');
      }
    });
  }

  const count = items.length;
  if (count === 0) {
    return '';
  } else if (count === 1) {
    return items[0];
  }

  const lastItem = items[count - 1];
  let output: ReactNode = items[0];
  for (let i = 1; i < count - 1; ++i) {
    switch (delimiter) {
      case Delimiters.SEMICOLON:
        output = (
          <fbt
            desc={
              'A list of items of various types, for example: ' +
              '"Menlo Park, CA; Seattle, WA; New York City, NY". ' +
              '{previous items} and {following items} are themselves ' +
              'lists that contain one or more items.'
            }
          >
            <fbt:param name="previous items">{output}</fbt:param>
            {'; '}
            <fbt:param name="following items">{items[i]}</fbt:param>
          </fbt>
        );
        break;
      case Delimiters.BULLET:
        output = (
          <fbt
            desc={
              'A list of items of various types separated by bullets, for example: ' +
              '"Menlo Park, CA \u2022 Seattle, WA \u2022 New York City, NY". ' +
              '{previous items} and {following items} are themselves ' +
              'lists that contain one or more items.'
            }
          >
            <fbt:param name="previous items">{output}</fbt:param> &bull;{' '}
            <fbt:param name="following items">{items[i]}</fbt:param>
          </fbt>
        );
        break;
      default:
        output = (
          <fbt
            desc={
              'A list of items of various types. {previous items} and' +
              ' {following items} are themselves lists that contain one or' +
              ' more items.'
            }
          >
            <fbt:param name="previous items">{output}</fbt:param>
            {', '}
            <fbt:param name="following items">{items[i]}</fbt:param>
          </fbt>
        );
    }
  }

  switch (conjunction) {
    case Conjunctions.AND:
      return (
        <fbt
          desc={
            'A list of items of various types, for example:' +
            ' "item1, item2, item3 and item4"'
          }
        >
          <fbt:param name="list of items">{output}</fbt:param>
          and
          <fbt:param name="last item">{lastItem}</fbt:param>
        </fbt>
      );

    case Conjunctions.OR:
      return (
        <fbt
          desc={
            'A list of items of various types, for example:' +
            ' "item1, item2, item3 or item4"'
          }
        >
          <fbt:param name="list of items">{output}</fbt:param>
          or
          <fbt:param name="last item">{lastItem}</fbt:param>
        </fbt>
      );
    case Conjunctions.NONE:
      switch (delimiter) {
        case Delimiters.SEMICOLON:
          return (
            <fbt
              desc={
                'A list of items of various types, for example:' +
                ' "Menlo Park, CA; Seattle, WA; New York City, NY". ' +
                '{previous items} itself contains one or more items.'
              }
            >
              <fbt:param name="previous items">{output}</fbt:param>
              {'; '}
              <fbt:param name="last item">{lastItem}</fbt:param>
            </fbt>
          );
        case Delimiters.BULLET:
          return (
            <fbt
              desc={
                'A list of items of various types separated by bullets, for example: ' +
                '"Menlo Park, CA \u2022 Seattle, WA \u2022 New York City, NY". ' +
                '{previous items} contains one or more items.'
              }
            >
              <fbt:param name="list of items">{output}</fbt:param> &bull;{' '}
              <fbt:param name="last item">{lastItem}</fbt:param>
            </fbt>
          );
        default:
          return (
            <fbt
              desc={
                'A list of items of various types, for example:' +
                ' "item1, item2, item3, item4"'
              }
            >
              <fbt:param name="list of items">{output}</fbt:param>
              {', '}
              <fbt:param name="last item">{lastItem}</fbt:param>
            </fbt>
          );
      }
    default:
      throw new Error(
        `fbt: Invalid conjunction '${conjunction}' provided to 'intlList'.`,
      );
  }
}
