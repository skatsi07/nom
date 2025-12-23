import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
        } else {
            // Redirect to profile (hardcoded to skatsi07 for now, or derive from user metadata later)
            navigate('/profile/skatsi07')
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-4 text-center">ViewEat Login</h1>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="p-2 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="p-2 border rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Sign In'}
                    </button>
                    {/* Sign Up disabled for single-user mode */}
                </form>
            </div>
        </div>
    )
}
