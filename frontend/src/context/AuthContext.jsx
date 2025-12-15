import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const response = await api.get('/api/user/profile');
                    if (response.data.success) {
                        setUser(response.data.user);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    logout();
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/user/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                setToken(response.data.token);
                setUser(response.data.user);
                toast.success("Login successful!");
                return { success: true };
            } else {
                toast.error(response.data.message);
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const signup = async (name, username, email, password) => {
        try {
            const response = await api.post('/api/user/register', { name, username, email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                setToken(response.data.token);
                setUser(response.data.user);
                toast.success("Account created successfully!");
                return { success: true };
            } else {
                toast.error(response.data.message);
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Signup failed';
            toast.error(msg);
            return { success: false, message: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
