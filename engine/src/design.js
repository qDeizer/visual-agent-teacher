// Concept colours. Glossary entries with concept:true get palette slots r1..r6 in order.
const BUILTIN = { neutral: 'neutral', accent: 'r5', danger: 'bad', success: 'ok', warn: 'warn' }
export const PALETTE = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6']

export function assignRoles(glossary) {
  const map = new Map()
  let i = 0
  for (const [key, g] of Object.entries(glossary || {})) if (g && g.concept) map.set(key, PALETTE[i++ % PALETTE.length])
  return map
}

export function roleSlot(stage, role) {
  if (!role) return 'neutral'
  if (BUILTIN[role]) return BUILTIN[role]
  return stage._roleSlots.get(role) || 'neutral'
}

/** variant: 'main' (graphic), 'ink' (text), 'soft' (fill) */
export function roleVar(stage, role, variant = 'main') {
  const s = roleSlot(stage, role)
  if (s === 'neutral') return variant === 'soft' ? 'var(--neutral-soft)' : variant === 'ink' ? 'var(--ink-2)' : 'var(--neutral)'
  if (s === 'ok' || s === 'bad' || s === 'warn') return variant === 'soft' ? `var(--${s}-soft)` : `var(--${s})`
  return variant === 'main' ? `var(--${s})` : `var(--${s}-${variant})`
}
