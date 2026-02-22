import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import './BackendLoadingScreen.css';

interface BackendLoadingScreenProps {
    children: React.ReactNode;
}

const BackendLoadingScreen: React.FC<BackendLoadingScreenProps> = ({ children }) => {
    const [isBackendUp, setIsBackendUp] = useState(false);
    const [showLoadingUI, setShowLoadingUI] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Waking up the server...");

    useEffect(() => {
        let isMounted = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        const checkHealth = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/health`, {
                    // A short timeout for the fetch itself could be added, but standard fetch behavior is fine
                    // as we want to know if it connects or fails.
                    method: 'GET'
                });

                if (response.ok) {
                    if (isMounted) setIsBackendUp(true);
                    return true;
                }
            } catch (error) {
                // Fetch failed (network error, connection refused, CORS when offline, etc.)
                console.log("Backend not reachable yet:", error);
            }
            return false;
        };

        const pollBackend = async () => {
            const up = await checkHealth();

            if (!up && isMounted) {
                // If not up yet, wait 2 seconds and try again
                timeoutId = setTimeout(pollBackend, 2000);
            }
        };

        // 1. Start polling immediately
        pollBackend();

        // 2. Only show the loading UI if the backend hasn't responded within 1000ms
        const loaderDelayId = setTimeout(() => {
            if (isMounted && !isBackendUp) {
                setShowLoadingUI(true);
            }
        }, 1000);

        // 3. Change message if it takes very long
        const messageDelayId = setTimeout(() => {
            if (isMounted && !isBackendUp) {
                setLoadingMessage("Almost there, warming up the engines...");
            }
        }, 8000);

        const messageDelayId2 = setTimeout(() => {
            if (isMounted && !isBackendUp) {
                setLoadingMessage("This usually takes around 15 seconds...");
            }
        }, 15000);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            clearTimeout(loaderDelayId);
            clearTimeout(messageDelayId);
            clearTimeout(messageDelayId2);
        };
    }, [isBackendUp]);

    // If backend is already up, or we are in the initial grace period (first 1s), render children
    // unless showLoadingUI is explicitly true.
    if (isBackendUp || !showLoadingUI) {
        if (isBackendUp) {
            return <>{children}</>;
        } else {
            // Grace period: Render nothing (or a completely blank screen) while waiting.
            // This avoids flashing the app on and off if the backend *is* fast enough.
            return <div style={{ height: '100vh', width: '100vw', backgroundColor: 'var(--bg-gray)' }}></div>;
        }
    }

    // We are blocked and showing the full-screen loader
    return (
        <div className="backend-loading-overlay">
            <div className="backend-loading-content">
                <div className="loader-ring"></div>
                <div className="loader-core"></div>
                <h2 className="loader-title">ViewEat</h2>
                <p className="loader-message fade-in-out">{loadingMessage}</p>
            </div>
        </div>
    );
};

export default BackendLoadingScreen;
