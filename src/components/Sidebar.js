import React, { useState, useEffect } from 'react';

function Sidebar({ user, cameras, groups, onSelectScope, onSignOut, isOpen, onToggle, currentScope, userToken }) {
    const [localUser, setLocalUser] = useState(null);

    // Load user from localStorage and keep it synced
    useEffect(() => {
        const loadUserFromStorage = () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                setLocalUser(parsedUser);
            } else {
                setLocalUser(null);
            }
        };

        // Load initially
        loadUserFromStorage();

        // Listen for storage changes (in case another tab logs out)
        window.addEventListener('storage', loadUserFromStorage);
        
        return () => {
            window.removeEventListener('storage', loadUserFromStorage);
        };
    }, []);

    // Use localStorage user or fallback to prop user
    const displayUser = localUser || user;

    // Don't show sidebar if not authenticated at all
    if (!userToken) {
        return null;
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                {displayUser ? (
                    <>
                        <img src={displayUser.picture} alt={displayUser.name} className="profile-pic" />
                        <h3>{displayUser.name}</h3>
                        <p>{displayUser.email}</p>
                    </>
                ) : (
                    <>
                        <div className="profile-pic-placeholder">👤</div>
                        <h3>User</h3>
                        <p>Authenticated</p>
                    </>
                )}
                <button onClick={onToggle} className="sidebar-toggle">
                    {isOpen ? '‹' : '›'}
                </button>
            </div>

            <nav className="sidebar-nav">
                <h4>Views</h4>
                <ul>
                    <li className={currentScope === 'latest' ? 'active' : ''}>
                        <button onClick={() => onSelectScope('latest')}>
                            Latest Events
                        </button>
                    </li>
                </ul>

                {groups.length > 0 && (
                    <>
                        <h4>Groups</h4>
                        <ul>
                            {groups.map(group => (
                                <li key={group} className={currentScope === `filter:${group}` ? 'active' : ''}>
                                    <button onClick={() => onSelectScope(`filter:${group}`)}>
                                        {group}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {cameras.length > 0 && (
                    <>
                        <h4>Cameras</h4>
                        <ul>
                            {cameras.map(camera => (
                                <li key={camera} className={currentScope === camera ? 'active' : ''}>
                                    <button onClick={() => onSelectScope(camera)}>
                                        {camera}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button onClick={onSignOut} className="signout-button">
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;