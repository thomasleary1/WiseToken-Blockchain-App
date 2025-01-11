import React, { useEffect, useState } from 'react';
import PublicKeyDisplay from './PublicKeyDisplay';
import './App.css';

function PendingTransactions() {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/transactions')
            .then(response => response.json())
            .then(data => setTransactions(data.pending_transactions))
            .catch(error => console.error('Error fetching transactions:', error));
    }, []);

    return (
        <div className="main-container">
            <h2>Pending Transactions</h2>
            <ul>
                {transactions.map((tx, index) => (
                    <li key={index}>
                        <p>Sender: <PublicKeyDisplay publicKey={tx.sender} /></p>
                        <p>Receiver: <PublicKeyDisplay publicKey={tx.receiver} /></p>
                        <p>Amount: {tx.amount}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PendingTransactions;