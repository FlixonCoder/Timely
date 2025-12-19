
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const LoadingContext = createContext({
    isLoading: false,
    setIsLoading: () => { },
});

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    // Counter to handle multiple parallel requests
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        const reqInterceptor = api.interceptors.request.use(
            (config) => {
                // predefined methods that trigger the loading state
                // "make or initiate a change" -> POST, PUT, DELETE, PATCH
                const mutationMethods = ['post', 'put', 'delete', 'patch'];

                if (config.method && mutationMethods.includes(config.method.toLowerCase())) {
                    setRequestCount(prev => prev + 1);
                }
                return config;
            },
            (error) => {
                // If request fails to send, we might not have incremented? 
                // Actually request interceptor error means it failed BEFORE sending.
                // Depending on where it fails, we might need to decrement if we incremented?
                // But usually the first callback returns config, so we incremented. 
                // If the second callback is hit, it means the request setup failed.
                // We shouldn't decrement here because we wouldn't have incremented in the first callback 
                // if the first callback itself failed/threw? 
                // Actually, if the first callback runs successfully, the request proceeds.
                return Promise.reject(error);
            }
        );

        const resInterceptor = api.interceptors.response.use(
            (response) => {
                const mutationMethods = ['post', 'put', 'delete', 'patch'];
                if (response.config.method && mutationMethods.includes(response.config.method.toLowerCase())) {
                    setRequestCount(prev => Math.max(0, prev - 1));
                }
                return response;
            },
            (error) => {
                const config = error.config;
                if (config) {
                    const mutationMethods = ['post', 'put', 'delete', 'patch'];
                    if (config.method && mutationMethods.includes(config.method.toLowerCase())) {
                        setRequestCount(prev => Math.max(0, prev - 1));
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.request.eject(reqInterceptor);
            api.interceptors.response.eject(resInterceptor);
        };
    }, []);

    useEffect(() => {
        setIsLoading(requestCount > 0);

        // Safety timeout to prevent stuck loading state
        let timeout;
        if (requestCount > 0) {
            timeout = setTimeout(() => {
                console.warn("Global loading state reset due to timeout.");
                setRequestCount(0);
            }, 10000); // 10 seconds max loading time
        }

        return () => clearTimeout(timeout);
    }, [requestCount]);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
