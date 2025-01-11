import { useState } from 'react';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            const data = await response.json();
            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            setMessage(data.message);
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username); 
            localStorage.setItem('publicKey', data.public_key);
            onLogin();
        } catch (error) {
            setMessage('Error connecting to server.');
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            <p>{message}</p>
        </div>
    );
}

export default Login;