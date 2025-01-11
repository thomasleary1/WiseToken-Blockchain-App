import React, { useState } from 'react';
import './App.css';
import WiseTokenImage from './WiseToken.png';

function SellCoins() {
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    const handleSell = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            setMessage('Please enter a valid amount to sell.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/sell_coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`Successfully sold ${amount} coins.`);
            } else {
                setMessage(`Failed to sell coins: ${data.message}`);
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        }
    };

    return (
        <div className="main-container">
            <img src={WiseTokenImage} alt="WiseToken" style={{ width: '100px', marginBottom: '20px' }} />
            <h2>Sell WiseToken</h2>
            <input
                type="number"
                placeholder="Enter amount to sell"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <button onClick={handleSell}>Sell Coins</button>
            {message && <p>{message}</p>}  {/* Display message (success or error) */}
        </div>
    );
}

export default SellCoins;