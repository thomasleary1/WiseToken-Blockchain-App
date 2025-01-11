import React, { useState } from 'react';
import './App.css';

function MineBlock() {
    const [message, setMessage] = useState('');

    const handleMine = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/mine_block', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Block mined successfully!');
            } else {
                setMessage(`Failed to mine block: ${data.message}`);
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        }
    };

    return (
        <div className="main-container">
            <h2>Mine a New Block</h2>
            <button onClick={handleMine}>Mine Block</button>
            {message && <p>{message}</p>}  {/* Display message (success or error) */}
        </div>
    );
}

export default MineBlock;