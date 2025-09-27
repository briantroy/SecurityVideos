import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';

import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import MediaViewer from './components/MediaViewer';
import { getCameraList } from './api';
import { API_HOST } from './api';
import './App.css';

// Offline Video Popup Component
const OfflineVideoPopup = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                    <h3>Video Not Available</h3>
                    <button className="popup-close" onClick={onClose}>×</button>
                </div>
                <div className="popup-body">
                    <p>This video has been moved to offline storage and is no longer available for online viewing.</p>
                    <p>Please try searching for a more recent date or contact your administrator if you need access to this content.</p>
                </div>
                <div className="popup-footer">
                    <button className="popup-button" onClick={onClose}>OK</button>
                </div>
            </div>
        </div>
    );
};

const GOOGLE_CLIENT_ID = "522648161569-735fsdpk8vf40tl854ktv0kg9629hn8d.apps.googleusercontent.com";
const GOOGLE_DOMAIN_ALLOWED = "brianandkelly.ws";


function App() {
    // Auto-refresh views list (cameras/groups) every 12 hours
    const viewsRefreshTimer = useRef();

    // JWT token is not stored in JS, but we track login state
    const [userToken, setUserToken] = useState(null); // Used only for UI state, not for API calls
    const [user, setUser] = useState(() => {
        // Load user data from localStorage on initialization
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [cameras, setCameras] = useState([]);
    const [groups, setGroups] = useState([]);
    // Load last scope from localStorage if available
    const [currentScope, setCurrentScope] = useState(() => {
        return localStorage.getItem('lastScope') || 'latest';
    });
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const mainContentRef = useRef(null);
    // Lift selectedMedia state to App.js
    const [selectedMedia, setSelectedMedia] = useState(null);
    // Offline video popup state
    const [showOfflineVideoPopup, setShowOfflineVideoPopup] = useState(false);

    // Auto-close sidebar on iPhone screen sizes
    useEffect(() => {
        const isIPhone = /iPhone/.test(navigator.userAgent) && window.innerWidth <= 600;
        if (isIPhone) {
            setSidebarOpen(false);
        }
    }, []);

    // Check for JWT cookie on app load
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_HOST}/auth/status`, { credentials: 'include' });
                if (res.ok) {
                    setUserToken('jwt-set');
                    const data = await res.json();
                    
                    // Only set user data if it's actually present
                    if ((data.name || data.username) && data.email && data.picture) {
                        const userData = {
                            name: data.name || data.username,
                            email: data.email,
                            picture: data.picture,
                        };
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else {
                        
                        // Keep existing localStorage user data if available
                    }
                } else {
                    setUserToken(null);
                    localStorage.removeItem('user');
                }
            } catch {
                setUserToken(null);
                localStorage.removeItem('user');
            }
        })();
    }, []);

    // Handle successful Google sign-in
    const handleLoginSuccess = async (credentialResponse) => {
        // Send Google credential to backend to set httpOnly JWT cookie
        try {
            const res = await fetch(`${API_HOST}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: credentialResponse.credential }),
                credentials: 'include', // allow cookie to be set cross-origin
            });
            if (!res.ok) throw new Error('Failed to authenticate with backend');
            // Optionally, get user info from backend response
            const data = await res.json();
            
            // Only set user data if it's actually present
            if ((data.name || data.username) && data.email && data.picture) {
                const userData = {
                    name: data.name || data.username,
                    email: data.email,
                    picture: data.picture,
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                
            }
            setUserToken('jwt-set'); // Just to trigger UI state
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    // Handle Google sign-in failure
    const handleLoginError = () => {
        console.error("Login Failed");
    };

    // Handle user sign-out
    const handleSignOut = useCallback(async () => {
        try {
            await fetch(`${API_HOST}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (err) {
            console.warn('Logout request failed:', err);
        }
        googleLogout();
        setUserToken(null);
        setUser(null);
        localStorage.removeItem('user');
        setCameras([]);
        setGroups([]);
    }, []);

    // Fetch camera and group lists after successful login and every 12 hours
    useEffect(() => {
        function fetchViewsList() {
            getCameraList()
                .then(data => {
                    setCameras(data.cameras || []);
                    setGroups(Object.keys(data.filters || {}));
                })
                .catch(err => {
                    console.error("Failed to fetch camera list:", err);
                    if (err.status === 401 || err.status === 403) {
                        alert("Session expired or unauthorized. Please log in again.");
                        handleSignOut();
                    }
                });
        }
        if (userToken === 'jwt-set') {
            fetchViewsList(); // Initial fetch
            if (viewsRefreshTimer.current) clearInterval(viewsRefreshTimer.current);
            viewsRefreshTimer.current = setInterval(() => {
                fetchViewsList();
            }, 12 * 60 * 60 * 1000); // 12 hours
        }
        return () => {
            if (viewsRefreshTimer.current) clearInterval(viewsRefreshTimer.current);
        };
    }, [userToken, handleSignOut]);

    // Save scope to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('lastScope', currentScope);
    }, [currentScope]);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };


    if (!userToken) {
        return (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} 
                                 state_cookie_domain={GOOGLE_DOMAIN_ALLOWED}
                                 allowed_parent_origin="https://security-videos.brianandkelly.ws, https://sec-vid-dev.brianandkelly.ws, http://localhost:3000"
                                 auto_prompt="true"
                                 auto_select="true">
                <div className="login-container">
                    <h2>Security Camera Viewer</h2>
                    <p>Please sign in to continue.</p>
                    <GoogleLogin
                        hosted_domain={GOOGLE_DOMAIN_ALLOWED}
                        onSuccess={handleLoginSuccess}
                        onError={handleLoginError}
                        useOneTap
                    />
                </div>
            </GoogleOAuthProvider>
        );
    }

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="app-container">
                <Sidebar
                    user={user}
                    cameras={cameras}
                    groups={groups}
                    onSelectScope={setCurrentScope}
                    onSignOut={handleSignOut}
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    currentScope={currentScope}
                    userToken={userToken}
                />
                <main ref={mainContentRef} className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                    <header className="main-header">
                        <h1>
                            {currentScope.startsWith('search:') ? (() => {
                                const searchDate = new Date(parseInt(currentScope.replace('search:', '')));
                                const lastScope = localStorage.getItem('lastNonSearchScope') || 'latest';
                                const scopeLabel = lastScope.startsWith('filter:') ? `Group: ${lastScope.substring(7)}` :
                                                  lastScope === 'latest' ? 'Latest Events' : `Camera: ${lastScope}`;
                                return `${scopeLabel} - Search: ${searchDate.toLocaleString()}`;
                            })() :
                             currentScope.startsWith('filter:') ? `Group: ${currentScope.substring(7)}` :
                             currentScope === 'latest' ? 'Latest Events' : `Camera: ${currentScope}`}
                        </h1>
                    </header>
                    <div className="responsive-panels">
                        <div className="timeline-panel">
                            <Timeline 
                                scope={currentScope} 
                                scrollableContainer={mainContentRef}
                                selectedMedia={selectedMedia}
                                setSelectedMedia={setSelectedMedia}
                                user={user}
                            />
                        </div>
                        <div className="media-viewer-panel">
                            <MediaViewer
                                event={selectedMedia}
                                onOfflineVideoError={() => setShowOfflineVideoPopup(true)}
                            />
                        </div>
                    </div>
                </main>
            </div>
            <OfflineVideoPopup
                isVisible={showOfflineVideoPopup}
                onClose={() => setShowOfflineVideoPopup(false)}
            />
        </GoogleOAuthProvider>
    );
}

export default App;