import { css, cx } from '@emotion/css';
import { Fragment, ReactNode, useMemo } from 'react';

export default function MapMessageTemplate({
  hasNext,
  isNext,
  message,
  punctuation,
  replacement,
}: {
  hasNext: boolean;
  isNext?: boolean;
  message: string;
  punctuation: string;
  replacement: ReactNode;
}) {
  return useMemo(() => {
    const parts = message.split(/({tag})/);
    const list = [];
    for (const [index, part] of parts.entries()) {
      const isFirst = isNext && index === 0;
      const showPunctuation = !hasNext && index === parts.length - 1;
      if (part === '{tag}') {
        const fragment = <Fragment key={index}>{replacement}</Fragment>;
        if (showPunctuation) {
          list.push(
            <span className={cx(inlineStyle, isFirst && firstLetterStyle)} key={index}>
              {fragment}
              {punctuation}
            </span>,
          );
          break;
        }

        list.push(fragment);
        continue;
      }

      list.push(
        <Fragment key={index}>
          {isFirst ? (
            <>
              <span className={firstLetterStyle}>{part.trimEnd()}</span>
              {part.endsWith(' ') ? ' ' : ''}
            </>
          ) : (
            part
          )}
          {showPunctuation ? punctuation : null}
        </Fragment>,
      );
    }

    return list;
  }, [hasNext, isNext, message, punctuation, replacement]);
}

const inlineStyle = css`
  display: inline-block;
  white-space: nowrap;
`;

const firstLetterStyle = css`
  display: inline-block;

  &::first-letter {
    text-transform: lowercase;
  }
`;
