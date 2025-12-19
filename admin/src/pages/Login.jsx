import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Lock, Mail, ChevronRight } from 'lucide-react';
import { backendUrl } from '../config';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/api/admin/login`, { email, password });

            if (response.data.success) {
                localStorage.setItem('adminToken', response.data.token);
                toast.success(response.data.message);
                navigate('/dashboard');
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8'>
            <div className='w-full max-w-md space-y-8'>

                {/* Header */}
                <div className='text-center'>
                    <h2 className='mt-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
                        Admin Portal
                    </h2>
                    <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                        Sign in to access the control panel
                    </p>
                </div>

                {/* Form Card */}
                <div className='bg-white dark:bg-gray-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-700'>
                    <form className='space-y-6' onSubmit={onSubmitHandler}>

                        {/* Email */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Email Address
                            </label>
                            <div className='mt-1 relative'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400'>
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm'
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Password
                            </label>
                            <div className='mt-1 relative'>
                                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400'>
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className='appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm'
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                                {!isLoading && (
                                    <span className='absolute right-3 inset-y-0 flex items-center pl-3'>
                                        <ChevronRight size={16} className="text-indigo-300 group-hover:text-indigo-100 transition-colors" />
                                    </span>
                                )}
                            </button>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    )
}

export default Login