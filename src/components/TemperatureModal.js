import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTemperatureHistory } from '../api';

function TemperatureModal({ cameraName, currentTemp, onClose }) {
    const [hours, setHours] = useState(24);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartReady, setChartReady] = useState(false);

    // Delay chart rendering until modal is mounted
    useEffect(() => {
        const timer = setTimeout(() => setChartReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getTemperatureHistory(cameraName, hours);
                setHistoryData(data.readings || []);
            } catch (err) {
                setError(err.message || 'Failed to load temperature history');
                console.error('Failed to fetch temperature history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [cameraName, hours]);

    // Format data for Recharts
    const formattedData = historyData.map(reading => ({
        time: reading.timestamp * 1000, // Convert to milliseconds
        temperature: reading.temperature,
        timestamp: reading.timestamp
    }));

    // Get temperature unit from current temp or first history reading
    const unit = currentTemp?.unit || (historyData.length > 0 ? historyData[0].unit : 'F');

    // Format X-axis time based on range
    const formatXAxisTime = (timestamp) => {
        const date = new Date(timestamp);
        if (hours <= 24) {
            // Show hour for 24h or less
            return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        } else {
            // Show date for longer ranges
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Format tooltip label
    const formatTooltipLabel = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Calculate time elapsed for "Updated X ago"
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const seconds = Math.floor(Date.now() / 1000 - timestamp);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const timeRanges = [
        { label: '6h', value: 6 },
        { label: '12h', value: 12 },
        { label: '24h', value: 24 },
        { label: '48h', value: 48 },
        { label: '7d', value: 168 }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="temperature-modal" onClick={(e) => e.stopPropagation()}>
                <div className="temperature-modal-header">
                    <div>
                        <h3>{cameraName} Temperature</h3>
                        {currentTemp && (
                            <p className="current-temperature">
                                Current:
                                <span className="temp-value">
                                    {currentTemp.temperature}°{currentTemp.unit}
                                </span>
                                <span className="temperature-updated">
                                    (Updated {getTimeAgo(currentTemp.timestamp)})
                                </span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="modal-close"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="temperature-modal-body">
                    <div className="time-range-selector">
                        {timeRanges.map(range => (
                            <button
                                key={range.value}
                                className={`time-range-btn ${hours === range.value ? 'active' : ''}`}
                                onClick={() => setHours(range.value)}
                                disabled={loading}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    <div className="temperature-chart-container">
                        {loading && (
                            <div className="temperature-loading">
                                <div className="temperature-loading-spinner"></div>
                                <p>Loading temperature data...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="temperature-error">
                                <div className="temperature-error-icon">⚠️</div>
                                <p className="temperature-error-message">{error}</p>
                                <button
                                    className="temperature-retry-btn"
                                    onClick={() => setHours(hours)} // Force re-fetch
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!loading && !error && historyData.length === 0 && (
                            <div className="temperature-empty">
                                <p>No temperature data available for this time range</p>
                                <p>Try selecting a different time range</p>
                            </div>
                        )}

                        {!loading && !error && historyData.length > 0 && chartReady && (
                            <ResponsiveContainer width="99%" height={350}>
                                    <LineChart
                                        data={formattedData}
                                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis
                                            dataKey="time"
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                            tickFormatter={formatXAxisTime}
                                        />
                                        <YAxis
                                            stroke="var(--text-secondary)"
                                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                            label={{
                                                value: `Temperature (°${unit})`,
                                                angle: -90,
                                                position: 'insideLeft',
                                                fill: 'var(--text-primary)'
                                            }}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                color: 'var(--text-primary)'
                                            }}
                                            formatter={(value) => [`${value}°${unit}`, 'Temperature']}
                                            labelFormatter={formatTooltipLabel}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="temperature"
                                            stroke="var(--accent-primary)"
                                            strokeWidth={2}
                                            dot={{ fill: 'var(--accent-primary)', r: 3 }}
                                            activeDot={{ r: 5 }}
                                        />
                                    </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TemperatureModal;
