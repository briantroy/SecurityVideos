import React, { useState, useEffect } from 'react';
import FilterValueInput from './FilterValueInput';
import FilterPreview from './FilterPreview';

function FilterEditModal({ filter, filters, cameras, onSave, onCancel }) {
    const isEditing = filter !== null;
    const [name, setName] = useState(filter?.name || '');
    const [operator, setOperator] = useState(filter ? filters[filter.name]?.operator || 'contains' : 'contains');
    const [value, setValue] = useState(filter ? filters[filter.name]?.value || '' : '');
    const [errors, setErrors] = useState([]);

    // Reset value when operator changes
    useEffect(() => {
        if (operator === 'in' && !Array.isArray(value)) {
            setValue([]);
        } else if (operator !== 'in' && Array.isArray(value)) {
            setValue('');
        }
    }, [operator, value]);

    const validateFilter = () => {
        const validationErrors = [];

        if (!name || name.trim() === '') {
            validationErrors.push('Filter name is required');
        }

        if (!isEditing && filters[name]) {
            validationErrors.push('A filter with this name already exists');
        }

        if (isEditing && name !== filter.name && filters[name]) {
            validationErrors.push('A filter with this name already exists');
        }

        if (!['contains', 'not_contains', 'in'].includes(operator)) {
            validationErrors.push('Invalid operator');
        }

        if (operator === 'in') {
            if (!Array.isArray(value) || value.length === 0) {
                validationErrors.push('Please select at least one camera');
            }
        } else {
            if (!value || value.trim() === '') {
                validationErrors.push('Value is required');
            }
        }

        return validationErrors;
    };

    const handleSave = () => {
        const validationErrors = validateFilter();
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        onSave({ name, operator, value });
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Edit Filter' : 'Create New Filter'}</h3>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                <div className="modal-body">
                    {errors.length > 0 && (
                        <div className="error-messages">
                            {errors.map((error, index) => (
                                <div key={index} className="error-message">{error}</div>
                            ))}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="filter-name">Filter Name:</label>
                        <input
                            id="filter-name"
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter filter name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="filter-operator">Operator:</label>
                        <select
                            id="filter-operator"
                            className="form-select"
                            value={operator}
                            onChange={(e) => setOperator(e.target.value)}
                        >
                            <option value="contains">Contains</option>
                            <option value="not_contains">Not Contains</option>
                            <option value="in">In (list)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="filter-value">
                            {operator === 'in' ? 'Select Cameras:' : 'Value:'}
                        </label>
                        <FilterValueInput
                            operator={operator}
                            value={value}
                            onChange={setValue}
                            cameras={cameras}
                        />
                    </div>

                    <FilterPreview
                        operator={operator}
                        value={value}
                        cameras={cameras}
                    />
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>
                        {isEditing ? 'Save Changes' : 'Create Filter'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterEditModal;
