import { useState } from 'react';
import { folderName, moveToFolder, saveFolder } from '../lib/folders';
import type { Routine } from '../types';
import { toast } from './dialogs';
import { IconCheck, IconClose, IconFolder } from './Icons';
import { Sheet } from './Sheet';

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
    <Sheet open={open} onClose={onClose} title={folder ? 'Edit folder' : 'New folder'}>
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
        if (!final) return setError('Name the folder, e.g. "Push Pull Legs".');
        if (!picked.size) return setError('Pick at least one routine to put in it.');
        await saveFolder(final, [...picked], folder);
        toast(folder ? 'Folder saved' : `Created “${final}”`);
        onDone();
      }}
    >
      <label className="field">
        <span>Folder name</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="e.g. Push Pull Legs"
          autoFocus={!folder}
        />
      </label>
      <fieldset className="field">
        <legend>Routines in this folder</legend>
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
                    {r.folder && r.folder !== folder && <span className="ex-row-meta">Now in {r.folder}</span>}
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
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {folder ? 'Save folder' : 'Create folder'}
        </button>
      </div>
    </form>
  );
}

/** Quick filing from a routine's menu: pick a folder, take it out, or start a new one. */
export function MoveToFolderSheet({ routine, routines, onClose }: { routine: Routine | null; routines: Routine[]; onClose: () => void }) {
  return (
    <Sheet open={!!routine} onClose={onClose} title={routine ? `Move “${routine.title}”` : undefined}>
      {routine && <MoveForm routine={routine} routines={routines} onDone={onClose} />}
    </Sheet>
  );
}

function MoveForm({ routine, routines, onDone }: { routine: Routine; routines: Routine[]; onDone: () => void }) {
  const existing = folderNames(routines).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const [name, setName] = useState('');

  async function move(folder: string | undefined) {
    await moveToFolder([routine.id], folder);
    toast(folder ? `Moved to “${folder}”` : 'Taken out of the folder');
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
              <span>No folder</span>
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
          <span>New folder</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Upper / Lower" />
        </label>
        <button type="submit" className="btn btn-secondary" disabled={!name.trim()}>
          Create
        </button>
      </form>
    </div>
  );
}
