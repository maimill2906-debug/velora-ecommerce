/** Path prefixes reserved for staff consoles + allowed user_type values (admin sees all). */
const STAFF_RULES: { prefix: string; roles: readonly string[] }[] = [
  { prefix: '/admin',   roles: ['admin'] },
  { prefix: '/marketing', roles: ['admin', 'marketing'] },
  { prefix: '/warehouse', roles: ['admin', 'warehouse'] },
  { prefix: '/sales',  roles: ['admin', 'sales'] },
  { prefix: '/pos',    roles: ['admin', 'sales'] },
]

export function pathOnly(url: string): string {
  try {
    const u = url.trim()
    if (u.startsWith('http')) return new URL(u).pathname || '/'
    return (u.split('?')[0] || '/').split('#')[0] || '/'
  } catch {
    return '/'
  }
}

export function defaultStaffHome(userType: string | null | undefined): string {
  switch (userType) {
    case 'admin':
      return '/admin'
    case 'marketing':
      return '/marketing'
    case 'warehouse':
      return '/warehouse'
    case 'sales':
      return '/sales'
    default:
      return '/'
  }
}

export function canAccessStaffPath(pathname: string, userType: string | null | undefined): boolean {
  if (!userType || userType === 'customer') {
    return !STAFF_RULES.some((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
  }
  if (userType === 'admin') return true
  const rule = STAFF_RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
  if (!rule) return true
  return rule.roles.includes(userType)
}

export function resolvePostLoginNavigate(nextUrl: string, userType: string | undefined): string {
  const path = pathOnly(nextUrl || '/')
  if (!userType || userType === 'customer') return nextUrl || '/'
  const home = defaultStaffHome(userType)
  if (!nextUrl || path === '/' || path === '') return home
  if (!canAccessStaffPath(path, userType)) return home
  return nextUrl
}
