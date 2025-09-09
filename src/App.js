import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import { getCameraList } from './api';
import './App.css';

const GOOGLE_CLIENT_ID = "522648161569-735fsdpk8vf40tl854ktv0kg9629hn8d.apps.googleusercontent.com";
const GOOGLE_DOMAIN_ALLOWED = "brianandkelly.ws";

function App() {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [groups, setGroups] = useState([]);
    const [currentScope, setCurrentScope] = useState('latest');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const mainContentRef = useRef(null);

    // Handle successful Google sign-in
    const handleLoginSuccess = (credentialResponse) => {
        const token = credentialResponse.credential;
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserToken(token);
        setUser({
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        });
    };

    // Handle Google sign-in failure
    const handleLoginError = () => {
        console.error("Login Failed");
    };

    // Handle user sign-out
    const handleSignOut = useCallback(() => {
        googleLogout();
        setUserToken(null);
        setUser(null);
        setCameras([]);
        setGroups([]);
    }, []);

    // Fetch camera and group lists after successful login
    useEffect(() => {
        if (userToken) {
            getCameraList(userToken)
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
    }, [userToken, handleSignOut]);

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
                />
                <main ref={mainContentRef} className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                    <header className="main-header">
                        <h1>
                            {currentScope.startsWith('filter:') ? `Filter: ${currentScope.substring(7)}` :
                             currentScope === 'latest' ? 'Latest Events' : `Camera: ${currentScope}`}
                        </h1>
                    </header>
                    <Timeline scope={currentScope} token={userToken} scrollableContainer={mainContentRef} />
                </main>
            </div>
        </GoogleOAuthProvider>
    );
}

export default App;