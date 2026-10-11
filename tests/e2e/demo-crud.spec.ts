import { test, expect } from '@playwright/test';
import { PLAN_ENABLED } from '../../src/lib/features';
test('demo supports edit and deletion, with plan controls when enabled', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/v1/')) calls.push(r.url());
  });
  await page.goto('/demo/jurnal/11111111-1111-4111-8111-111111111111');
  await page.getByRole('link', { name: 'Edit catatan', exact: true }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await page.getByLabel('Judul').fill('Judul fiktif yang diubah');
  await page.getByRole('button', { name: 'Simpan catatan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Judul fiktif yang diubah' })).toBeVisible();
  await page.getByRole('button', { name: 'Hapus catatan', exact: true }).click();
  await page.getByRole('button', { name: 'Ya, hapus catatan', exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/jurnal$/);
  await expect(page.getByText('Judul fiktif yang diubah')).toHaveCount(0);
  if (!PLAN_ENABLED) {
    await expect(page.getByRole('link', { name: 'Rencana', exact: true })).toHaveCount(0);
    expect(calls).toEqual([]);
    return;
  }
  await page.goto('/demo/rencana');
  await page.getByRole('button', { name: 'Edit rencana', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah langkah', exact: true }).click();
  await page.getByLabel('Langkah 3', { exact: true }).fill('Langkah fiktif ketiga');
  await page.getByRole('button', { name: 'Naikkan langkah 3' }).click();
  await expect(page.getByLabel('Langkah 2', { exact: true })).toHaveValue('Langkah fiktif ketiga');
  await page.getByRole('button', { name: 'Tambah kontak', exact: true }).click();
  await page.getByLabel('Nama kontak 1').fill('Contoh fiktif');
  await page.getByLabel('Nomor telepon', { exact: true }).fill('080000000000');
  await page.getByRole('button', { name: 'Simpan rencana', exact: true }).click();
  await expect(page.getByText('Rencana sudah disimpan.', { exact: true })).toBeVisible();
  await expect(page.locator('.plan-view li').nth(1)).toContainText('Langkah fiktif ketiga');
  await page.getByRole('button', { name: 'Contoh fiktif' }).click();
  await expect(page.getByRole('dialog')).toContainText('Kontak pada demo tidak dihubungi.');
  expect(calls).toEqual([]);
});
