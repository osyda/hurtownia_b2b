import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

export function generateIntegrationToken() {
  return `b2b_${randomBytes(32).toString('base64url')}`
}

export function hashIntegrationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function safeHashEqual(a: string, b: string) {
  const left = Buffer.from(a, 'hex')
  const right = Buffer.from(b, 'hex')
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function authenticateIntegration(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) return { error: 'Brak tokena API', status: 401 as const }

  const tokenHash = hashIntegrationToken(match[1].trim())
  const supabase = await createAdminClient()

  const { data: candidates, error } = await supabase
    .from('tenant_integrations')
    .select('id, tenant_id, provider, name, config, api_token_hash')
    .eq('is_active', true)
    .not('api_token_hash', 'is', null)

  if (error) return { error: error.message, status: 500 as const }

  const integration = candidates?.find(candidate =>
    candidate.api_token_hash && safeHashEqual(candidate.api_token_hash, tokenHash)
  )

  if (!integration) return { error: 'Nieprawidlowy token API', status: 401 as const }

  return {
    integration: {
      id: integration.id as string,
      tenant_id: integration.tenant_id as string,
      provider: integration.provider as string,
      name: integration.name as string,
      config: integration.config as Record<string, unknown>,
    },
    supabase,
  }
}
