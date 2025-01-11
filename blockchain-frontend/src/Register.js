import { useState } from 'react';
import { Link } from 'react-router-dom';

function Register({ onSuccess }) {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);

    const handleRegister = async () => {
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        const data = await response.json();
        if (response.status === 201) {
            setMessage(data.message);
            setIsRegistered(true);
            onSuccess();
        } else {
            setMessage(data.message);
        }
    };

    return (
        <div>
            {!isRegistered ? (
                <>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button onClick={handleRegister}>Register</button>
                </>
            ) : (
                <>
                    <p>{message}</p>
                    <Link to="/login">Go to Login</Link>
                </>
            )}
        </div>
    );
}

export default Register;