/** @type {Array<{id: string, name: string, emoji: string, kind: 'expense'|'income', color: string}>} */
export const CATEGORIES = [
  { id: 'groceries',     name: 'Groceries',        emoji: '🛒', kind: 'expense', color: 'oklch(0.82 0.16 168)' },
  { id: 'rent',          name: 'Rent',              emoji: '🏠', kind: 'expense', color: 'oklch(0.72 0.15 230)' },
  { id: 'transport',     name: 'Transport',         emoji: '🚗', kind: 'expense', color: 'oklch(0.7 0.18 295)'  },
  { id: 'food',          name: 'Food & Chai',       emoji: '🍱', kind: 'expense', color: 'oklch(0.82 0.16 75)'  },
  { id: 'bills',         name: 'Recharge & Bills',  emoji: '📱', kind: 'expense', color: 'oklch(0.7 0.2 25)'   },
  { id: 'emi',           name: 'EMI',               emoji: '💳', kind: 'expense', color: 'oklch(0.7 0.18 340)' },
  { id: 'education',     name: 'Education',         emoji: '📚', kind: 'expense', color: 'oklch(0.78 0.14 200)' },
  { id: 'entertainment', name: 'Entertainment',     emoji: '🎬', kind: 'expense', color: 'oklch(0.72 0.18 310)' },
  { id: 'health',        name: 'Health',            emoji: '⚕️', kind: 'expense', color: 'oklch(0.74 0.16 145)' },
  { id: 'gifts',         name: 'Gifts',             emoji: '🎁', kind: 'expense', color: 'oklch(0.78 0.16 50)'  },
  { id: 'salary',        name: 'Salary',            emoji: '💼', kind: 'income',  color: 'oklch(0.82 0.16 168)' },
  { id: 'others',        name: 'Others',            emoji: '✨', kind: 'expense', color: 'oklch(0.7 0.04 260)'  },
];

/**
 * Find a category by id — falls back to "Others" if not found.
 * @param {string} id
 */
export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

/** All expense category ids */
export const EXPENSE_CATEGORY_IDS = CATEGORIES
  .filter((c) => c.kind === 'expense')
  .map((c) => c.id);
