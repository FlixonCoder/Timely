
import React from 'react'
import { Route, Router, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Sidebar from './components/Sidebar'

import Dashboard from './pages/Dashboard'
import TaskManager from './pages/TaskManager'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MainLayout = () => {
  const { token } = useAuth(); // Access auth state
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (token) {
    // --- LOGGED IN VIEW ---
    // Sidebar on the left, Dashboard on the right
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 md:ml-64 ml-0 transition-all duration-300 w-full">
          <Routes>
            <Route path="/dashboard" element={<Dashboard onMenuClick={() => setIsSidebarOpen(true)} />} />
            <Route path="/task-manager" element={<TaskManager onMenuClick={() => setIsSidebarOpen(true)} />} />
            <Route path="/my-profile" element={<Profile onMenuClick={() => setIsSidebarOpen(true)} />} />
            {/* Redirect any other path to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // --- LOGGED OUT VIEW ---
  // Standard Navbar + Public Pages
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          {/* Redirect dashboard access attempt to login */}
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainLayout />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </AuthProvider>
  )
}

export default App
