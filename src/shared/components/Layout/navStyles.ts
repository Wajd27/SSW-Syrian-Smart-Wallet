/** Shared desktop + mobile nav link classes (RTL-aware active accent). */
export function getNavLinkClassName(isActive: boolean): string {
  const base =
    'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 min-h-[44px] border border-s-4';
  if (isActive) {
    return `${base} bg-chip-bg border-app-border border-s-primary-500 text-chip-text shadow-sm rtl:border-s-0 rtl:border-e-4 rtl:border-e-primary-500`;
  }
  return `${base} border-transparent border-s-transparent text-app-soft hover:bg-white/90 hover:text-app`;
}
