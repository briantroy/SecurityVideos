import React, { useState, useEffect } from 'react';
import FilterEditModal from './FilterEditModal';
import ConfirmDialog from './ConfirmDialog';
import TemperatureModal from './TemperatureModal';
import { getLatestTemperatures } from '../api';

function Sidebar({ user, cameras, filters, filterOrder, onSelectScope, onSignOut, isOpen, onToggle, currentScope, userToken, isDarkMode, onToggleDarkMode, onSaveFilters }) {
    const [localUser, setLocalUser] = useState(null);
    const [searchDate, setSearchDate] = useState('');
    const [searchTime, setSearchTime] = useState('');
    const [isDateSearchCollapsed, setIsDateSearchCollapsed] = useState(true);
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const [editingFilter, setEditingFilter] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [openMenuFilter, setOpenMenuFilter] = useState(null);
    const [openMenuCamera, setOpenMenuCamera] = useState(null);
    const [temperatures, setTemperatures] = useState({});
    const [selectedTempCamera, setSelectedTempCamera] = useState(null);

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

    // Fetch latest temperatures for cameras
    useEffect(() => {
        if (!userToken) return;

        const fetchTemperatures = async () => {
            try {
                const data = await getLatestTemperatures();
                setTemperatures(data.cameras || {});
            } catch (error) {
                console.warn('Failed to fetch temperatures:', error);
                // Don't alert - temperature is optional feature
            }
        };

        fetchTemperatures(); // Initial fetch
        const interval = setInterval(fetchTemperatures, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(interval);
    }, [userToken]);

    // Initialize date/time picker with current date/time or search scope values
    useEffect(() => {
        if (currentScope.startsWith('search:')) {
            // If we're in search mode, set the inputs to the search date/time and expand
            const timestamp = parseInt(currentScope.replace('search:', ''));
            const searchDateTime = new Date(timestamp);
            setSearchDate(searchDateTime.toLocaleDateString('en-CA')); // YYYY-MM-DD format
            setSearchTime(searchDateTime.toTimeString().slice(0, 5)); // HH:MM format
            setIsDateSearchCollapsed(false); // Auto-expand when in search mode
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

    // Filter operation handlers
    const handleCreateFilter = (filterData) => {
        const newFilters = {
            ...filters,
            [filterData.name]: {
                operator: filterData.operator,
                value: filterData.value
            }
        };
        onSaveFilters(newFilters);
        setFilterModalOpen(false);
    };

    const handleUpdateFilter = (oldName, filterData) => {
        if (oldName !== filterData.name) {
            // Renaming - rebuild object to preserve order
            const newFilters = {};
            Object.keys(filters).forEach(key => {
                if (key === oldName) {
                    newFilters[filterData.name] = {
                        operator: filterData.operator,
                        value: filterData.value
                    };
                } else {
                    newFilters[key] = filters[key];
                }
            });
            onSaveFilters(newFilters);
        } else {
            // Just update values
            const newFilters = {
                ...filters,
                [filterData.name]: {
                    operator: filterData.operator,
                    value: filterData.value
                }
            };
            onSaveFilters(newFilters);
        }
        setFilterModalOpen(false);
    };

    const handleDeleteFilter = (filterName) => {
        const newFilters = {};
        Object.keys(filters).forEach(key => {
            if (key !== filterName) {
                newFilters[key] = filters[key];
            }
        });
        onSaveFilters(newFilters);
        setShowDeleteConfirm(null);

        // If we're currently viewing the deleted filter, switch to latest
        if (currentScope === `filter:${filterName}`) {
            onSelectScope('latest');
        }
    };

    const handleMoveFilter = (filterName, direction) => {
        const currentIndex = filterOrder.indexOf(filterName);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= filterOrder.length) return;

        const newOrder = [...filterOrder];
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

        // Rebuild filters object in new order
        const newFilters = {};
        newOrder.forEach(name => {
            newFilters[name] = filters[name];
        });

        onSaveFilters(newFilters);
    };

    const handleMoveCamera = (cameraName, direction) => {
        const currentIndex = cameras.indexOf(cameraName);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= cameras.length) return;

        const newCameras = [...cameras];
        [newCameras[currentIndex], newCameras[newIndex]] = [newCameras[newIndex], newCameras[currentIndex]];

        // Save the reordered cameras array along with filters
        onSaveFilters(filters, newCameras);
    };

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
                <div className="collapsible-section">
                    <h4
                        className="collapsible-header"
                        onClick={() => setIsDateSearchCollapsed(!isDateSearchCollapsed)}
                    >
                        Date/Time Search
                        <span className={`collapse-icon ${isDateSearchCollapsed ? 'collapsed' : 'expanded'}`}>
                            ▼
                        </span>
                    </h4>
                    <div className={`date-time-search ${isDateSearchCollapsed ? 'collapsed' : 'expanded'}`}>
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
                </div>

                <h4>Views</h4>
                <ul>
                    <li className={activeScope === 'latest' ? 'active' : ''}>
                        <button onClick={() => onSelectScope('latest')}>
                            Latest Events
                        </button>
                    </li>
                </ul>

                <div className="groups-header">
                    <h4>Groups</h4>
                    <button
                        className="add-filter-btn"
                        onClick={() => {
                            setEditingFilter(null);
                            setFilterModalOpen(true);
                        }}
                        title="Add new filter"
                    >
                        + Add
                    </button>
                </div>
                {filterOrder.length > 0 && (
                    <ul>
                        {filterOrder.map((filterName, index) => (
                            <li key={filterName} className={activeScope === `filter:${filterName}` ? 'active' : ''}>
                                <button
                                    className="filter-name"
                                    onClick={() => onSelectScope(`filter:${filterName}`)}
                                >
                                    {filterName}
                                </button>
                                <button
                                    className="filter-menu-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuFilter(openMenuFilter === filterName ? null : filterName);
                                    }}
                                    title="Filter options"
                                >
                                    ⋮
                                </button>
                                {openMenuFilter === filterName && (
                                    <div className="filter-dropdown">
                                        <button
                                            onClick={() => {
                                                setEditingFilter({ name: filterName });
                                                setFilterModalOpen(true);
                                                setOpenMenuFilter(null);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(filterName);
                                                setOpenMenuFilter(null);
                                            }}
                                        >
                                            Delete
                                        </button>
                                        {index > 0 && (
                                            <button
                                                onClick={() => {
                                                    handleMoveFilter(filterName, 'up');
                                                    setOpenMenuFilter(null);
                                                }}
                                            >
                                                ↑ Up
                                            </button>
                                        )}
                                        {index < filterOrder.length - 1 && (
                                            <button
                                                onClick={() => {
                                                    handleMoveFilter(filterName, 'down');
                                                    setOpenMenuFilter(null);
                                                }}
                                            >
                                                ↓ Down
                                            </button>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {cameras.length > 0 && (
                    <>
                        <h4>Cameras</h4>
                        <ul>
                            {cameras.map((camera, index) => (
                                <li key={camera} className={activeScope === camera ? 'active' : ''}>
                                    <button
                                        className="filter-name"
                                        onClick={() => onSelectScope(camera)}
                                    >
                                        {camera}
                                        {temperatures[camera] && (
                                            <span
                                                className="camera-temperature"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTempCamera(camera);
                                                }}
                                                title="Click to view temperature history"
                                            >
                                                ({temperatures[camera].temperature}°{temperatures[camera].unit})
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        className="filter-menu-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuCamera(openMenuCamera === camera ? null : camera);
                                        }}
                                        title="Camera options"
                                    >
                                        ⋮
                                    </button>
                                    {openMenuCamera === camera && (
                                        <div className="filter-dropdown">
                                            {index > 0 && (
                                                <button
                                                    onClick={() => {
                                                        handleMoveCamera(camera, 'up');
                                                        setOpenMenuCamera(null);
                                                    }}
                                                >
                                                    ↑ Up
                                                </button>
                                            )}
                                            {index < cameras.length - 1 && (
                                                <button
                                                    onClick={() => {
                                                        handleMoveCamera(camera, 'down');
                                                        setOpenMenuCamera(null);
                                                    }}
                                                >
                                                    ↓ Down
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <button
                    onClick={onToggleDarkMode}
                    className="theme-toggle"
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button onClick={onSignOut} className="signout-button">
                    Sign Out
                </button>
            </div>

            {isFilterModalOpen && (
                <FilterEditModal
                    filter={editingFilter}
                    filters={filters}
                    cameras={cameras}
                    onSave={(filterData) => {
                        if (editingFilter) {
                            handleUpdateFilter(editingFilter.name, filterData);
                        } else {
                            handleCreateFilter(filterData);
                        }
                    }}
                    onCancel={() => setFilterModalOpen(false)}
                />
            )}

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Delete Filter?"
                    message={`Are you sure you want to delete "${showDeleteConfirm}"? This cannot be undone.`}
                    onConfirm={() => handleDeleteFilter(showDeleteConfirm)}
                    onCancel={() => setShowDeleteConfirm(null)}
                />
            )}

            {selectedTempCamera && (
                <TemperatureModal
                    cameraName={selectedTempCamera}
                    currentTemp={temperatures[selectedTempCamera]}
                    onClose={() => setSelectedTempCamera(null)}
                />
            )}
        </aside>
    );
}

export default Sidebar;