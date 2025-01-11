import React, { useEffect, useState } from 'react';
import PublicKeyDisplay from './PublicKeyDisplay';
import './App.css';

function Blockchain() {
    const [chain, setChain] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/chain')
            .then(response => response.json())
            .then(data => setChain(data.chain))
            .catch(error => console.error('Error fetching blockchain:', error));
    }, []);

    return (
        <div className="main-container">
            <h2>Blockchain</h2>
            <ul>
                {chain.map(block => (
                    <li key={block.index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc' }}>
                        <strong>Block {block.index}</strong>
                        <p>Hash: {block.hash}</p>
                        <p>Previous Hash: {block.previous_hash}</p>
                        <p>Timestamp: {new Date(block.timestamp * 1000).toLocaleString()}</p>
                        <p>Transactions:</p>
                        <ul>
                            {block.transactions.map((tx, index) => (
                                <li key={index}>
                                    <p>Sender: <PublicKeyDisplay publicKey={tx.sender} /></p>
                                    <p>Receiver: <PublicKeyDisplay publicKey={tx.receiver} /></p>
                                    <p>Amount of WiseToken: {tx.amount}</p>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Blockchain;