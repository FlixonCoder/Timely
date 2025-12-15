import React from 'react';
import { User, Mail, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePopup = ({ isOpen, onClose, anchorRef }) => {
    const { user } = useAuth();

    if (!isOpen) return null;

    // Use default or placeholder if not set
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    // Format DOB if exists
    const formattedDob = user?.dob
        ? new Date(user.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : "Not set";

    return (
        <div className="absolute right-0 top-16 z-50 w-80 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">

                {/* Header / Cover */}
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                        <div className="relative">
                            {/* Profile Image - Use user.image or fallback */}
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-lg">
                                    <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">{initial}</span>
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900"></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 pb-6 px-6 text-center space-y-4">

                    {/* Name & Tag */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
                            {user?.name || "Guest User"}
                            <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                        </h3>
                        <p className="text-sm text-blue-500 font-medium">@{user?.username || "guest"}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-2 text-left pt-2">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Mail size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Email</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user?.email || "No email"}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                <Calendar size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Joined / DOB</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formattedDob}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-2 border-t border-gray-100 dark:border-gray-800 text-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Member since 2025</span>
                </div>
            </div>
        </div>
    );
};

export default ProfilePopup;
