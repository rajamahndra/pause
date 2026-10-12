import { PLAN_ENABLED } from './features';

export function validView(path: string[]) {
  if (!path.length) return true;
  if (path[0] === 'rencana') return PLAN_ENABLED && path.length === 1;
  return ['pengaturan', 'jurnal'].includes(path[0]) && (path.length === 1 || (path[0] === 'jurnal' && (path.length === 2 || (path.length === 3 && path[2] === 'edit'))));
}
