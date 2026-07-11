'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-semibold text-blue-600">
        MedCompare
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/ai-recommend" className="text-sm text-gray-600 hover:text-gray-900">
          AI Suggest
        </Link>
        <Link href="/hospitals" className="text-sm text-gray-600 hover:text-gray-900">
          Find Hospitals
        </Link>
        <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">
          Search
        </Link>

        {user ? (
          <>
            <span className="text-sm text-gray-600">Hi, {user.name}</span>
            <Link href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700">
              Dashboard
            </Link>
            <button onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-600">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/auth/register"
              className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}