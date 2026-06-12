'use client'

import { FormEvent, useActionState, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { requestPasswordResetAction } from '@/app/actions/password-reset'
import { createClient } from '@/lib/supabase/client'
import { getTenantSlugFromHost, hostMatchesTenantDomain, isLikelyCustomDomainHost } from '@/lib/shop-routing'

type Mode = 'checking' | 'request' | 'update'

interface ResetPasswordFormProps {
  loginHref?: string
  isTenantContext?: boolean
}

function sameTenantError() {
  return 'Link resetowania jest nieprawidłowy, wygasł albo nie pasuje do tego adresu logowania.'
}

export function ResetPasswordForm({ loginHref = '/login', isTenantContext = false }: ResetPasswordFormProps) {
  const supabase = useMemo(() => createClient(), [])
  const [state, formAction, requestPending] = useActionState(requestPasswordResetAction, {})
  const [mode, setMode] = useState<Mode>('checking')
  const [recoveryError, setRecoveryError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatePending, setUpdatePending] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    async function validateRecoveryContext() {
      const tenantHostSlug = getTenantSlugFromHost(window.location.host)
      const customDomainHost = isLikelyCustomDomainHost(window.location.host)
      const { data: userRes, error: userError } = await supabase.auth.getUser()
      const user = userRes.user

      if (userError || !user) return false

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) return false

      if (tenantHostSlug || customDomainHost) {
        if ((profile.role === 'tenant_admin' || profile.role === 'tenant_employee') && profile.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('slug, custom_domain, custom_domain_status')
            .eq('id', profile.tenant_id)
            .maybeSingle()

          return Boolean(tenant && hostMatchesTenantDomain(window.location.host, tenant))
        }

        if (profile.role === 'customer') {
          const { data: customer } = await supabase
            .from('customers')
            .select('tenants(slug, custom_domain, custom_domain_status)')
            .eq('user_id', user.id)
            .maybeSingle()

          const tenant = customer?.tenants as unknown as { slug: string; custom_domain?: string | null; custom_domain_status?: string | null } | null
          return Boolean(tenant && hostMatchesTenantDomain(window.location.host, tenant))
        }

        return false
      }

      return profile.role === 'super_admin'
    }

    async function prepareRecoverySession() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
      const hashError = hash.get('error_description') || hash.get('error')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (hashError) {
        setRecoveryError(sameTenantError())
        setMode('request')
        return
      }

      if (!code && (!accessToken || !refreshToken)) {
        setMode('request')
        return
      }

      try {
        const sessionResult = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! })

        if (sessionResult.error) throw sessionResult.error

        window.history.replaceState(null, '', '/reset-password')

        const validContext = await validateRecoveryContext()
        if (!validContext) {
          await supabase.auth.signOut()
          setRecoveryError(sameTenantError())
          setMode('request')
          return
        }

        setMode('update')
      } catch (error) {
        console.error('[password-reset] Recovery session failed', error)
        await supabase.auth.signOut()
        setRecoveryError(sameTenantError())
        setMode('request')
      }
    }

    prepareRecoverySession()
  }, [supabase])

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUpdateError('')

    if (password.length < 8) {
      setUpdateError('Hasło musi mieć minimum 8 znaków.')
      return
    }

    if (password !== confirmPassword) {
      setUpdateError('Hasła nie są takie same.')
      return
    }

    setUpdatePending(true)
    const { error } = await supabase.auth.updateUser({ password })
    setUpdatePending(false)

    if (error) {
      setUpdateError('Nie udało się zmienić hasła. Otwórz link resetujący ponownie.')
      return
    }

    await supabase.auth.signOut()
    setUpdated(true)
  }

  if (mode === 'checking') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#E2DCD0] bg-[#F8F5EF] px-3 py-3 text-sm font-semibold text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Sprawdzam link resetowania...
      </div>
    )
  }

  if (updated) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <CheckCircle2 className="mb-2 h-5 w-5" />
          Hasło zostało zmienione. Możesz zalogować się ponownie.
        </div>
        <a href={loginHref} className="brand-button flex w-full py-3 font-bold">
          Wróć do logowania
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    )
  }

  if (mode === 'update') {
    return (
      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">Nowe hasło</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="premium-input w-full"
            placeholder="Minimum 8 znaków"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">Powtórz hasło</label>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            className="premium-input w-full"
            placeholder="Wpisz hasło ponownie"
          />
        </div>

        {updateError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {updateError}
          </p>
        )}

        <button type="submit" disabled={updatePending} className="brand-button flex w-full py-3 font-bold disabled:opacity-50">
          {updatePending && <Loader2 className="h-4 w-4 animate-spin" />}
          Ustaw nowe hasło
          {!updatePending && <ShieldCheck className="h-4 w-4" />}
        </button>
      </form>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">E-mail konta</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="premium-input w-full"
          placeholder={isTenantContext ? 'email@twojafirma.pl' : 'wlasciciel@dostawio.pl'}
        />
      </div>

      {recoveryError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          {recoveryError}
        </p>
      )}

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Jeśli konto istnieje pod tym adresem logowania, wysłaliśmy link do ustawienia nowego hasła.
        </p>
      )}

      <button type="submit" disabled={requestPending} className="brand-button flex w-full py-3 font-bold disabled:opacity-50">
        {requestPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Wyślij link resetujący
        {!requestPending && <Mail className="h-4 w-4" />}
      </button>

      <a href={loginHref} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Wróć do logowania
      </a>
    </form>
  )
}
