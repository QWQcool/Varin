export type Pt = { readonly x: number; readonly y: number };

export const quadPoint = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
});

export const quadLength = (a: Pt, c: Pt, b: Pt): number => {
  let length = 0;
  let prev = a;
  for (let i = 1; i <= 48; i++) {
    const next = quadPoint(a, c, b, i / 48);
    length += Math.hypot(next.x - prev.x, next.y - prev.y);
    prev = next;
  }
  return length;
};
