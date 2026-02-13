type Props = React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export default function Image(props: Props) {
  if (!props.src) {
    return null;
  }

  const parts = props.src.split('.');
  const extension = parts.pop();
  const image = <img loading="lazy" {...props} />;
  return (
    <picture>
      <source
        media="(prefers-color-scheme: dark)"
        srcSet={[...parts, 'dark', extension].join('.')}
      />
      <source
        media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)"
        srcSet={props.src}
      />
      {image}
    </picture>
  );
}
