import React from 'react';

function Sidebar({ user, cameras, groups, onSelectScope, onSignOut, isOpen, onToggle, currentScope }) {
    if (!user) {
        return null;
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <img src={user.picture} alt={user.name} className="profile-pic" />
                <h3>{user.name}</h3>
                <p>{user.email}</p>
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