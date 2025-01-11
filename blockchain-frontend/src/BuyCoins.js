import React, { useState } from 'react';
import './App.css';
import WiseTokenImage from './WiseToken.png';

function BuyCoins() {
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    const handleBuy = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            setMessage('Please enter a valid amount to buy.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/buy_coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(`Successfully bought ${amount} coins.`);
            } else {
                setMessage(`Failed to buy coins: ${data.message}`);
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        }
    };

    return (
        <div className="main-container">
            <img src={WiseTokenImage} alt="WiseToken" style={{ width: '100px', marginBottom: '20px' }} />
            <h2>Buy WiseToken</h2>
            <input
                type="number"
                min="0.01"
                placeholder="Enter amount to buy"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
            />
            <button onClick={handleBuy}>Buy Coins</button>
            {message && <p>{message}</p>}  {/* Display message (success or error) */}
        </div>
    );
}

export default BuyCoins;