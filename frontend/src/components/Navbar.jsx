import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
    const [darkMode, setDarkMode] = useState(() => {
        return (
            localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
        )
    })

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    const { token, logout } = useAuth()

    const toggleTheme = () => setDarkMode(!darkMode)

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-md p-4 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="container mx-auto flex justify-between items-center">
                <Link
                    to="/"
                    className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"
                >
                    <span>Timely</span>
                </Link>

                <div className="flex items-center gap-6">
                    <div className="space-x-4 hidden md:block">
                        <Link
                            to="/"
                            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium"
                        >
                            Home
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-lg shadow-blue-500/30 font-medium"
                        >
                            Login
                        </Link>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Toggle Dark Mode"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
