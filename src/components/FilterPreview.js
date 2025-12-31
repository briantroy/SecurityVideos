import React from 'react';

function FilterPreview({ operator, value, cameras }) {
    const applyFilterLocally = (operator, value, cameras) => {
        if (!value) return [];

        if (operator === 'contains') {
            return cameras.filter(cam => cam.includes(value));
        } else if (operator === 'not_contains') {
            return cameras.filter(cam => !cam.includes(value));
        } else if (operator === 'in') {
            return cameras.filter(cam => value.includes(cam));
        }
        return [];
    };

    const matchedCameras = applyFilterLocally(operator, value, cameras);

    return (
        <div className="filter-preview">
            <strong>Preview:</strong>{' '}
            {matchedCameras.length > 0 ? (
                <span>Will match {matchedCameras.length} camera(s): {matchedCameras.join(', ')}</span>
            ) : (
                <span className="warning">No cameras will match</span>
            )}
        </div>
    );
}

export default FilterPreview;
