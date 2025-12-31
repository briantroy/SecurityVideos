import React from 'react';

function FilterValueInput({ operator, value, onChange, cameras }) {
    if (operator === 'in') {
        return (
            <div className="camera-checklist">
                {cameras.map(camera => (
                    <label key={camera} className="camera-checkbox">
                        <input
                            type="checkbox"
                            checked={Array.isArray(value) && value.includes(camera)}
                            onChange={(e) => {
                                const currentValue = Array.isArray(value) ? value : [];
                                const newValue = e.target.checked
                                    ? [...currentValue, camera]
                                    : currentValue.filter(c => c !== camera);
                                onChange(newValue);
                            }}
                        />
                        <span>{camera}</span>
                    </label>
                ))}
            </div>
        );
    }

    // For 'contains' and 'not_contains'
    return (
        <input
            type="text"
            className="filter-value-input"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={operator === 'contains'
                ? 'Enter text to match'
                : operator === 'not_contains'
                ? 'Enter text to exclude'
                : 'Enter value'}
        />
    );
}

export default FilterValueInput;
