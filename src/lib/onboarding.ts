export type OnboardingPriority = 'critical' | 'important' | 'growth'

export interface OnboardingCounts {
  categories: number
  products: number
  customers: number
  paymentMethods: number
  priceGroups: number
  integrations: number
  orders: number
  customerPaymentAssignments?: number
}

export interface OnboardingTenantInfo {
  name: string | null
  slug: string | null
  contact_email: string | null
  contact_phone?: string | null
  brand_color?: string | null
}

export interface OnboardingInput {
  tenant: OnboardingTenantInfo
  counts: OnboardingCounts
  hasDeliverySettings: boolean
}

export interface OnboardingItem {
  id: string
  title: string
  description: string
  href: string
  done: boolean
  priority: OnboardingPriority
}

export interface OnboardingState {
  score: number
  completed: number
  total: number
  label: string
  summary: string
  items: OnboardingItem[]
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function tenantPath(tenantSlug: string, path: string) {
  return `/${tenantSlug}/${path.replace(/^\//, '')}`
}

export function buildTenantOnboarding(input: OnboardingInput, tenantSlug: string): OnboardingState {
  const { tenant, counts, hasDeliverySettings } = input
  const hasAssignedPayments = counts.customerPaymentAssignments === undefined
    ? counts.customers > 0
    : counts.customerPaymentAssignments > 0

  const items: OnboardingItem[] = [
    {
      id: 'company',
      title: 'Dane firmy',
      description: 'Nazwa, slug i e-mail kontaktowy są potrzebne do poprawnej komunikacji z klientami.',
      href: tenantPath(tenantSlug, 'settings'),
      done: hasText(tenant.name) && hasText(tenant.slug) && hasText(tenant.contact_email),
      priority: 'critical',
    },
    {
      id: 'payments',
      title: 'Formy płatności',
      description: 'Hurtownia musi mieć aktywne metody płatności, żeby klient mógł złożyć zamówienie.',
      href: tenantPath(tenantSlug, 'settings'),
      done: counts.paymentMethods > 0,
      priority: 'critical',
    },
    {
      id: 'delivery',
      title: 'Dostawa i minimum zamówienia',
      description: 'Ustaw dni dostaw, godzinę graniczną i minimalną wartość zamówienia.',
      href: tenantPath(tenantSlug, 'settings'),
      done: hasDeliverySettings,
      priority: 'important',
    },
    {
      id: 'categories',
      title: 'Kategorie produktów',
      description: 'Kategorie porządkują katalog i ułatwiają klientom szybkie składanie zamówień.',
      href: tenantPath(tenantSlug, 'categories'),
      done: counts.categories > 0,
      priority: 'important',
    },
    {
      id: 'products',
      title: 'Pierwsze produkty',
      description: 'Dodaj produkty ręcznie albo przez import, najlepiej z kodami SKU pod przyszłą integrację.',
      href: tenantPath(tenantSlug, 'products'),
      done: counts.products > 0,
      priority: 'critical',
    },
    {
      id: 'customers',
      title: 'Klienci i przypisane płatności',
      description: 'Dodaj klienta B2B i przypisz mu formy płatności widoczne w koszyku.',
      href: tenantPath(tenantSlug, 'customers'),
      done: counts.customers > 0 && hasAssignedPayments,
      priority: 'critical',
    },
    {
      id: 'prices',
      title: 'Cenniki i grupy cenowe',
      description: 'Ustal bazowe grupy cenowe, zanim hurtownia zacznie obsługiwać większą liczbę klientów.',
      href: tenantPath(tenantSlug, 'prices'),
      done: counts.priceGroups > 0,
      priority: 'growth',
    },
    {
      id: 'integrations',
      title: 'Integracja ERP/API',
      description: 'Wygeneruj token i przygotuj profil systemu ERP/WMS klienta.',
      href: tenantPath(tenantSlug, 'integrations'),
      done: counts.integrations > 0,
      priority: 'growth',
    },
    {
      id: 'first_order',
      title: 'Pierwsze zamówienie testowe',
      description: 'Testowe zamówienie potwierdza katalog, klienta, płatność i workflow obsługi.',
      href: tenantPath(tenantSlug, 'orders'),
      done: counts.orders > 0,
      priority: 'growth',
    },
  ]

  const completed = items.filter(item => item.done).length
  const total = items.length
  const score = Math.round((completed / total) * 100)
  const criticalDone = items.filter(item => item.priority === 'critical' && item.done).length
  const criticalTotal = items.filter(item => item.priority === 'critical').length

  const label = score >= 85
    ? 'Gotowa do sprzedaży'
    : criticalDone === criticalTotal
      ? 'Operacyjnie gotowa'
      : score >= 40
        ? 'W trakcie konfiguracji'
        : 'Wymaga podstaw'

  const summary = criticalDone === criticalTotal
    ? 'Najważniejsze elementy są gotowe. Można dopinać integracje, cenniki i testy sprzedaży.'
    : 'Najpierw domknij dane firmy, płatności, produkty oraz klienta z przypisaną formą płatności.'

  return { score, completed, total, label, summary, items }
}

export function externalizeOnboardingLinks(state: OnboardingState, baseUrl: string): OnboardingState {
  const normalizedBase = baseUrl.replace(/\/$/, '')

  return {
    ...state,
    items: state.items.map(item => ({
      ...item,
      href: `${normalizedBase}${item.href.replace(/^\/[^/]+/, '')}`,
    })),
  }
}
