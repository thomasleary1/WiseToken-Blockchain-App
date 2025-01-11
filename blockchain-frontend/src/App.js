import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom';
import Blockchain from './Blockchain';
import PendingTransactions from './PendingTransactions';
import TransactionForm from './TransactionForm';
import MineBlock from './MineBlock';
import Register from './Register';
import Login from './Login';
import BuyCoins from './BuyCoins';
import SellCoins from './SellCoins';
import Balance from './Balance';
import WiseTokenImage from './WiseToken.png'; 
import './App.css';

function ProtectedRoute({ isAuthenticated, children }) {
    return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [username, setUsername] = useState('');
    const [publicKey, setPublicKey] = useState('');

    useEffect(() => {
        const auth = localStorage.getItem('isAuthenticated');
        const storedUsername = localStorage.getItem('username');
        const storedPublicKey = localStorage.getItem('publicKey');
        setIsAuthenticated(auth === 'true');
        setUsername(storedUsername || '');
        setPublicKey(storedPublicKey || '');
        setIsAuthChecked(true);
    }, []);

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'isAuthenticated') {
                setIsAuthenticated(event.newValue === 'true');
            }
            if (event.key === 'username') {
                setUsername(event.newValue || '');
            }
            if (event.key === 'publicKey') {
                setPublicKey(event.newValue || '');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleLoginSuccess = () => {
        const storedUsername = localStorage.getItem('username');
        const storedPublicKey = localStorage.getItem('publicKey');
        setIsAuthenticated(true);
        setUsername(storedUsername || '');
        setPublicKey(storedPublicKey || '');
        localStorage.setItem('isAuthenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUsername('');
        setPublicKey('');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('publicKey');
    };

    const handleRegisterSuccess = () => {
       
    };

    if (!isAuthChecked) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div style={{ padding: '20px' }}>
                <img src={WiseTokenImage} alt="WiseToken" className="wise-token-logo" />
                <div className="header-container">
                    <h1 className="header-title">Blockchain and Cryptocurrency Application</h1>
                    {isAuthenticated && (
                        <div className="username">
                            <p>Username: {username}</p>
                        </div>
                    )}
                </div>
                <nav>
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/" exact>Blockchain</NavLink>
                            <NavLink to="/transactions">Pending Transactions</NavLink>
                            <NavLink to="/add-transaction">Add Transaction</NavLink>
                            <NavLink to="/mine">Mine Block</NavLink>
                            <NavLink to="/buy-coins">Buy Coins</NavLink>
                            <NavLink to="/sell-coins">Sell Coins</NavLink>
                            <NavLink to="/balance">Balance</NavLink>
                            <NavLink to="/" onClick={handleLogout} className="logout">Logout</NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/register">Register</NavLink>
                            <NavLink to="/login">Login</NavLink>
                        </>
                    )}
                </nav>
                <hr />
                <Routes>
                    <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Blockchain /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute isAuthenticated={isAuthenticated}><PendingTransactions /></ProtectedRoute>} />
                    <Route path="/add-transaction" element={<ProtectedRoute isAuthenticated={isAuthenticated}><TransactionForm publicKey={publicKey} /></ProtectedRoute>} />
                    <Route path="/mine" element={<ProtectedRoute isAuthenticated={isAuthenticated}><MineBlock /></ProtectedRoute>} />
                    <Route path="/buy-coins" element={<ProtectedRoute isAuthenticated={isAuthenticated}><BuyCoins /></ProtectedRoute>} />
                    <Route path="/sell-coins" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SellCoins /></ProtectedRoute>} />
                    <Route path="/balance" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Balance /></ProtectedRoute>} />
                    <Route path="/register" element={<Register onSuccess={handleRegisterSuccess} />} />
                    <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
                </Routes>
            </div>
        </Router>
    );
}

function NavLink({ to, exact, children, ...props }) {
    const location = useLocation();
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
        <Link to={to} className={isActive ? 'active' : ''} {...props}>
            {children}
        </Link>
    );
}

export default App;