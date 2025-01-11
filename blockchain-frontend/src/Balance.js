import React, { useEffect, useState } from 'react';
import './App.css';
import WiseTokenImage from './WiseToken.png';

function Balance() {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        .then((response) => response.json())
        .then((data) => {
            if (data && data.balance !== undefined) {
                setBalance(data.balance);
                setLoading(false);
            } else {
                setError(data.message || 'Balance not found');
                setLoading(false);
            }
        })
        .catch((error) => {
            console.error('Error fetching balance:', error);
            setError('Error fetching balance');
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <p className="loading-text">Loading balance...</p>;
    }

    if (error) {
        return <p className="loading-text">{error}</p>;
    }

    return (
        <div className="main-container">
            <img src={WiseTokenImage} alt="WiseToken" style={{ width: '100px', marginBottom: '20px' }} />
            <h2>Your Balance</h2>
            <p>{balance} WiseToken</p>
        </div>
    );
}

export default Balance;