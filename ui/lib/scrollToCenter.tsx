const isWindow = (container: Element | Window): container is Window =>
  container === window;

export default function scrollToCenter(container: Element | Window) {
  container.scrollTo(
    isWindow(container)
      ? {
          left:
            (document.documentElement.scrollWidth - container.innerWidth) / 2,
          top:
            (document.documentElement.scrollHeight - container.innerHeight) / 2,
        }
      : {
          left: (container.scrollWidth - container.clientWidth) / 2,
          top: (container.scrollHeight - container.clientHeight) / 2,
        },
  );
}
