import { LoginForm } from '@/components/shared/login-form'

export default function LoginPage() {
  return (
    <div className="premium-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-900/15">
            B2B
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">B2B Connect</h1>
          <p className="mt-2 text-sm text-slate-500">Zaloguj sie do swojego konta</p>
        </div>
        <div className="premium-card p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
