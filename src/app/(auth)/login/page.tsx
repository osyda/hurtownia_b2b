import { LoginForm } from '@/components/shared/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">B2B Connect</h1>
          <p className="text-gray-500 mt-2">Zaloguj się do swojego konta</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
