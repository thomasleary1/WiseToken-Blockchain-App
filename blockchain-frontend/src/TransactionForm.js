import React, { useState } from 'react';
import PublicKeyDisplay from './PublicKeyDisplay';
import './App.css';

function TransactionForm({ publicKey }) {
    const [receiverPublicKey, setReceiverPublicKey] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        const newTransaction = { receiverPublicKey: receiverPublicKey.trim(), amount };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/transactions/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newTransaction),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Transaction added successfully!');
                setReceiverPublicKey('');
                setAmount('');
            } else {
                setMessage(`Failed to add transaction: ${data.message}`);
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        }
    };

    return (
        <div className="main-container">
            <h2>Send WiseToken To Another Users Account</h2>
            <form onSubmit={handleSubmit}>
                <input
                    value={receiverPublicKey}
                    onChange={e => setReceiverPublicKey(e.target.value)}
                    placeholder="Receiver's Public Key"
                    required
                />
                <input
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amount"
                    required
                />
                <button type="submit">Add Transaction</button>
            </form>
            {message && <p>{message}</p>}  {/* Display message (success or error) */}
            <div style={{ marginTop: '20px' }}>
                <p>Your Public Key: <PublicKeyDisplay publicKey={publicKey} /></p>
            </div>
        </div>
    );
}

export default TransactionForm;