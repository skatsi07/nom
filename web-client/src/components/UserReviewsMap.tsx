import React from 'react';

interface UserReviewsMapProps {
    username: string;
    onReviewSelect: (review: any) => void;
    style?: React.CSSProperties;
}

const UserReviewsMap: React.FC<UserReviewsMapProps> = ({ style }) => {
    return (
        <div style={{ ...style, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#888' }}>Map Component Placeholder (File was missing)</p>
        </div>
    );
};

export default UserReviewsMap;
