import React, { useState, useEffect } from 'react';

function Sidebar({ user, cameras, groups, onSelectScope, onSignOut, isOpen, onToggle, currentScope, userToken }) {
    const [localUser, setLocalUser] = useState(null);
    const [searchDate, setSearchDate] = useState('');
    const [searchTime, setSearchTime] = useState('');

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

    // Initialize date/time picker with current date/time or search scope values
    useEffect(() => {
        if (currentScope.startsWith('search:')) {
            // If we're in search mode, set the inputs to the search date/time
            const timestamp = parseInt(currentScope.replace('search:', ''));
            const searchDateTime = new Date(timestamp);
            setSearchDate(searchDateTime.toLocaleDateString('en-CA')); // YYYY-MM-DD format
            setSearchTime(searchDateTime.toTimeString().slice(0, 5)); // HH:MM format
        } else {
            // Default to current date/time
            const now = new Date();
            setSearchDate(now.toLocaleDateString('en-CA')); // YYYY-MM-DD format
            setSearchTime(now.toTimeString().slice(0, 5)); // HH:MM format
        }
    }, [currentScope]);

    // Determine the actual view context for highlighting
    const getActiveScope = () => {
        if (currentScope.startsWith('search:')) {
            return localStorage.getItem('lastNonSearchScope') || 'latest';
        }
        return currentScope;
    };

    const activeScope = getActiveScope();

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
                <h4>Date/Time Search</h4>
                <div className="date-time-search">
                    <div className="search-inputs">
                        <input
                            type="date"
                            className="search-date-input"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                        />
                        <input
                            type="time"
                            className="search-time-input"
                            value={searchTime}
                            onChange={(e) => setSearchTime(e.target.value)}
                        />
                    </div>
                    <button
                        className="search-button"
                        onClick={() => {
                            if (searchDate && searchTime) {
                                const searchDateTime = new Date(`${searchDate}T${searchTime}`);
                                const searchScope = `search:${searchDateTime.getTime()}`;
                                onSelectScope(searchScope);
                            }
                        }}
                    >
                        Search Videos
                    </button>
                </div>

                <h4>Views</h4>
                <ul>
                    <li className={activeScope === 'latest' ? 'active' : ''}>
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
                                <li key={group} className={activeScope === `filter:${group}` ? 'active' : ''}>
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
                                <li key={camera} className={activeScope === camera ? 'active' : ''}>
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