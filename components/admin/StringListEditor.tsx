'use client';

import { Button } from './ui';
import { inputClass } from './ui';

/**
 * Editor for a list of plain strings (pricing features, roles, workflow steps…).
 * Supports add / edit / delete / reorder with order preserved.
 */
export default function StringListEditor({
  label,
  items,
  onChange,
  addLabel = 'Add item',
  placeholder = 'Item text',
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  addLabel?: string;
  placeholder?: string;
}) {
  const list = Array.isArray(items) ? items : [];

  const update = (index: number, value: string) => {
    const next = [...list];
    next[index] = value;
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(list.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-stone-700">{label}</p>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
          No items yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-[11px] text-stone-400">{index + 1}</span>
              <input
                value={item}
                placeholder={placeholder}
                onChange={(event) => update(index, event.target.value)}
                className={inputClass}
              />
              <Button onClick={() => move(index, -1)} disabled={index === 0} title="Move up">
                ↑
              </Button>
              <Button onClick={() => move(index, 1)} disabled={index === list.length - 1} title="Move down">
                ↓
              </Button>
              <Button variant="danger" onClick={() => remove(index)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        className="mt-3"
        onClick={() => onChange([...list, ''])}
      >
        + {addLabel}
      </Button>
    </div>
  );
}