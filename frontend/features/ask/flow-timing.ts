export function wait(duration: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, duration));
}

export function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
