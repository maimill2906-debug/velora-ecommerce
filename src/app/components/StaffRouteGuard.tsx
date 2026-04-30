import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import {
  apiFetch,
  getAuthToken,
  getSessionUserType,
  setSessionUserType,
} from '@/lib/apiClient'
import { defaultStaffHome } from '@/lib/roleAccess'

type MeResponse = { user_type: string }

/**
 * Requires Bearer auth; restricts route to given user_type values (admin always allowed).
 */
export function StaffRouteGuard({
  allow,
  children,
}: {
  allow: readonly string[]
  children: React.ReactNode
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userType, setUserType] = useState<string | null>(() => getSessionUserType())
  const [phase, setPhase] = useState<'loading' | 'ok' | 'redirect'>(() =>
    getAuthToken() && getSessionUserType() ? 'ok' : 'loading'
  )

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      const next = `${location.pathname}${location.search}`
      navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true })
      setPhase('redirect')
      return
    }

    const cached = getSessionUserType()
    if (cached) {
      setUserType(cached)
      setPhase('ok')
      return
    }

    let cancelled = false
    apiFetch<MeResponse>('/auth/me', { auth: true })
      .then((me) => {
        if (cancelled) return
        setSessionUserType(me.user_type)
        setUserType(me.user_type)
        setPhase('ok')
      })
      .catch(() => {
        if (cancelled) return
        navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`, {
          replace: true,
        })
        setPhase('redirect')
      })

    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname, location.search])

  useEffect(() => {
    if (phase !== 'ok' || !userType) return
    const allowed = userType === 'admin' || allow.includes(userType)
    if (allowed) return
    const fallback = defaultStaffHome(userType)
    navigate(fallback, { replace: true })
  }, [phase, userType, allow, navigate])

  if (phase !== 'ok' || !userType) {
    if (phase === 'redirect') return null
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  if (userType !== 'admin' && !allow.includes(userType)) {
    return null
  }

  return <>{children}</>
}
