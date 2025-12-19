import React from 'react';
import { motion } from 'framer-motion';

const GlobalLoader = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm"
        >
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-24 h-24 rounded-full border-4 border-slate-200/20 shadow-[0_0_15px_rgba(0,0,0,0.1)] animate-[spin_3s_linear_infinite]"></div>

                {/* Inner Glowing Ring */}
                <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-t-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-[spin_1.5s_linear_infinite]"></div>

                {/* Center Geometric Shape */}
                <div className="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-full h-full relative animate-[pulse_2s_ease-in-out_infinite]">
                        <div className="absolute w-full h-full bg-indigo-600/30 rounded-lg transform rotate-45 backdrop-blur-md"></div>
                        <div className="absolute w-full h-full bg-purple-600/30 rounded-lg transform rotate-12 backdrop-blur-md"></div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-200 tracking-wider animate-pulse">
                        PROCESSING
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default GlobalLoader;
