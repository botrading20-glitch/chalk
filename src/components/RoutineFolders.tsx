import { useEffect, useId, useRef, useState } from 'react';
import { folderName, moveItem, moveToFolder, reorderRoutines, saveFolder } from '../lib/folders';
import type { Routine } from '../types';
import { toast } from './dialogs';
import { IconArrowDown, IconCheck, IconClose, IconFolder, IconGrip, IconUp } from './Icons';
import { Sheet } from './Sheet';
import { t } from '../i18n';

const folderNames = (routines: Routine[]) => [...new Set(routines.flatMap((r) => (r.folder ? [r.folder] : [])))];

/** Create a folder, or rename one and change which routines are in it. */
export function FolderSheet({
  open,
  onClose,
  folder,
  routines,
}: {
  open: boolean;
  onClose: () => void;
  /** The folder being edited; absent to create one. */
  folder?: string;
  routines: Routine[];
}) {
  return (
    <Sheet open={open} onClose={onClose} title={folder ? t('folder.edit') : t('folder.new')}>
      {open && <FolderForm folder={folder} routines={routines} onDone={onClose} />}
    </Sheet>
  );
}

function FolderForm({ folder, routines, onDone }: { folder?: string; routines: Routine[]; onDone: () => void }) {
  const [name, setName] = useState(folder ?? '');
  const [picked, setPicked] = useState(() => new Set(routines.filter((r) => folder !== undefined && r.folder === folder).map((r) => r.id)));
  const [error, setError] = useState('');

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        const final = folderName(name, folderNames(routines).filter((f) => f !== folder));
        if (!final) return setError(t('folder.nameRequired'));
        if (!picked.size) return setError(t('folder.pickOne'));
        await saveFolder(final, [...picked], folder);
        toast(folder ? t('folder.saved') : t('folder.created', { name: final }));
        onDone();
      }}
    >
      <label className="field">
        <span>{t('folder.name')}</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder={t('folder.namePlaceholder')}
          autoFocus={!folder}
        />
      </label>
      <fieldset className="field">
        <legend>{t('folder.routinesIn')}</legend>
        <ul className="ex-list">
          {routines.map((r) => {
            const on = picked.has(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`ex-row ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  onClick={() => {
                    toggle(r.id);
                    setError('');
                  }}
                >
                  <span className="ex-row-text">
                    <span className="ex-row-name">{r.title}</span>
                    {r.folder && r.folder !== folder && <span className="ex-row-meta">{t('folder.nowIn', { folder: r.folder })}</span>}
                  </span>
                  {on && (
                    <span className="ex-row-check">
                      <IconCheck size={16} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn btn-primary">
          {folder ? t('folder.save') : t('folder.create')}
        </button>
      </div>
    </form>
  );
}

/** Quick filing from a routine's menu: pick a folder, take it out, or start a new one. */
export function MoveToFolderSheet({ routine, routines, onClose }: { routine: Routine | null; routines: Routine[]; onClose: () => void }) {
  return (
    <Sheet open={!!routine} onClose={onClose} title={routine ? t('folder.move', { title: routine.title }) : undefined}>
      {routine && <MoveForm routine={routine} routines={routines} onDone={onClose} />}
    </Sheet>
  );
}

function MoveForm({ routine, routines, onDone }: { routine: Routine; routines: Routine[]; onDone: () => void }) {
  const existing = folderNames(routines).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const [name, setName] = useState('');

  async function move(folder: string | undefined) {
    await moveToFolder([routine.id], folder);
    toast(folder ? t('folder.moved', { folder }) : t('folder.takenOut'));
    onDone();
  }

  return (
    <div className="move-folder">
      {existing.length > 0 && (
        <div className="action-list">
          {existing.map((f) => (
            <button key={f} className="action-item" onClick={() => move(f)} aria-current={routine.folder === f}>
              <IconFolder />
              <span className="move-folder-name">{f}</span>
              {routine.folder === f && <IconCheck size={18} />}
            </button>
          ))}
          {routine.folder && (
            <button className="action-item" onClick={() => move(undefined)}>
              <IconClose />
              <span>{t('folder.none')}</span>
            </button>
          )}
        </div>
      )}
      <form
        className="new-folder-row"
        onSubmit={(e) => {
          e.preventDefault();
          const final = folderName(name, existing);
          if (final) void move(final);
        }}
      >
        <label className="field">
          <span>{t('folder.new')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('folder.newPlaceholder')} />
        </label>
        <button type="submit" className="btn btn-secondary" disabled={!name.trim()}>
          {t('folder.createShort')}
        </button>
      </form>
    </div>
  );
}

/** Change the order of the routines in one folder (or those in no folder). */
export function ReorderSheet({ open, title, routines, onClose }: { open: boolean; title: string; routines: Routine[]; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {open && <ReorderList routines={routines} onDone={onClose} />}
    </Sheet>
  );
}

type MoveControl = 'handle' | 'up' | 'down';

interface Drag {
  id: string;
  from: number;
  startY: number;
  dy: number;
  /** Distance between two rows, in px. */
  pitch: number;
}

/**
 * Drag a row by its handle; the arrow buttons (and arrow keys on the handle)
 * do the same without dragging. Every move is saved straight away.
 */
function ReorderList({ routines, onDone }: { routines: Routine[]; onDone: () => void }) {
  const [ids, setIds] = useState(() => routines.map((r) => r.id));
  const [drag, setDrag] = useState<Drag | null>(null);
  // Pointer handlers read the drag from here: a quick drop can arrive before the last move has rendered.
  const dragRef = useRef<Drag | null>(null);
  const [refocus, setRefocus] = useState<{ id: string; control: MoveControl } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const list = useRef<HTMLOListElement>(null);
  const hint = useId();

  // Follow routines added or removed elsewhere (another device, say) while the sheet is open.
  const byId = new Map(routines.map((r) => [r.id, r]));
  const shown = [...ids.filter((id) => byId.has(id)), ...routines.filter((r) => !ids.includes(r.id)).map((r) => r.id)];
  const last = shown.length - 1;
  // The row stays within the list, and lands on the slot nearest to it.
  const clampDy = (d: Drag, dy: number) => Math.min(Math.max(dy, -d.from * d.pitch), (last - d.from) * d.pitch);
  const slotFor = (d: Drag, dy: number) => d.from + Math.round(clampDy(d, dy) / d.pitch);
  const dy = drag ? clampDy(drag, drag.dy) : 0;
  const target = drag ? slotFor(drag, drag.dy) : -1;

  function commit(from: number, to: number, control?: MoveControl) {
    if (to === from || to < 0 || to > last) return;
    const next = moveItem(shown, from, to);
    setIds(next);
    void reorderRoutines(next);
    setAnnouncement(t('reorder.position', { title: byId.get(shown[from])?.title ?? '', n: to + 1, total: next.length }));
    if (control) setRefocus({ id: shown[from], control });
  }

  useEffect(() => {
    // A moved row is re-inserted into the page, which drops its focus: put it back.
    if (!refocus) return;
    const row = list.current?.querySelector(`[data-id="${CSS.escape(refocus.id)}"]`);
    const el = row?.querySelector<HTMLButtonElement>(`[data-move="${refocus.control}"]`);
    (el && !el.disabled ? el : row?.querySelector<HTMLButtonElement>('[data-move="handle"]'))?.focus();
    setRefocus(null);
  }, [refocus]);

  return (
    <div className="reorder">
      <p className="muted small" id={hint}>
        {t('reorder.hint')}
      </p>
      <ol className={`reorder-list ${drag ? 'is-dragging' : ''}`} ref={list}>
        {shown.map((id, i) => {
          const r = byId.get(id)!;
          let shift = 0;
          if (drag?.id === id) shift = dy;
          else if (drag && drag.from < target && i > drag.from && i <= target) shift = -drag.pitch;
          else if (drag && target < drag.from && i >= target && i < drag.from) shift = drag.pitch;
          return (
            <li
              key={id}
              data-id={id}
              className={`reorder-row ${drag?.id === id ? 'dragging' : ''}`}
              style={shift ? { transform: `translateY(${shift}px)` } : undefined}
            >
              <button
                type="button"
                className="drag-handle"
                data-move="handle"
                aria-label={t('reorder.move', { title: r.title })}
                aria-describedby={hint}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  const row = e.currentTarget.closest('li')!;
                  const next = row.nextElementSibling as HTMLElement | null;
                  const prev = row.previousElementSibling as HTMLElement | null;
                  const pitch = next ? next.offsetTop - row.offsetTop : prev ? row.offsetTop - prev.offsetTop : row.offsetHeight;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragRef.current = { id, from: i, startY: e.clientY, dy: 0, pitch };
                  setDrag(dragRef.current);
                }}
                onPointerMove={(e) => {
                  const d = dragRef.current;
                  if (d?.id === id) setDrag({ ...d, dy: e.clientY - d.startY });
                }}
                onPointerUp={(e) => {
                  const d = dragRef.current;
                  dragRef.current = null;
                  setDrag(null);
                  if (d?.id === id) commit(d.from, slotFor(d, e.clientY - d.startY));
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                  setDrag(null);
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                  e.preventDefault();
                  commit(i, i + (e.key === 'ArrowUp' ? -1 : 1), 'handle');
                }}
              >
                <IconGrip />
              </button>
              <span className="reorder-name">{r.title}</span>
              <button
                type="button"
                className="icon-btn"
                data-move="up"
                disabled={i === 0}
                aria-label={t('reorder.up', { title: r.title })}
                onClick={() => commit(i, i - 1, 'up')}
              >
                <IconUp size={20} />
              </button>
              <button
                type="button"
                className="icon-btn"
                data-move="down"
                disabled={i === last}
                aria-label={t('reorder.down', { title: r.title })}
                onClick={() => commit(i, i + 1, 'down')}
              >
                <IconArrowDown size={20} />
              </button>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
        {t('common.done')}
      </button>
    </div>
  );
}
