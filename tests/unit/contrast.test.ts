import { it, expect } from 'vitest';
const luminance = (hex: string) => {
  const rgb = hex
    .match(/\w\w/g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
it('text palette meets WCAG AA for normal text on its actual surfaces', () => {
  for (const [fg, bg] of [
    ['29312B', 'F8F5EC'],
    ['62665C', 'F8F5EC'],
    ['425844', 'BCCBAA'],
    ['795944', 'F5D7C4'],
    ['6E5747', 'F5D7C4'],
    ['FFFCF5', '425844'],
    ['62665C', 'FFFCF5'],
  ]) {
    const a = luminance(fg),
      b = luminance(bg);
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), fg + ' on ' + bg).toBeGreaterThanOrEqual(4.5);
  }
});
