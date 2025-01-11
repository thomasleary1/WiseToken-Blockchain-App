import React, { useState } from 'react';
import copyButtonImage from './copybutton.png';

function PublicKeyDisplay({ publicKey }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const copyToClipboard = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(publicKey).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const shortenedKey = `${publicKey.slice(0, 10)}...${publicKey.slice(-10)}`;

    const formatKey = (key) => {
        const chunkSize = 64;
        const chunks = [];
        for (let i = 0; i < key.length; i += chunkSize) {
            chunks.push(key.slice(i, i + chunkSize));
        }
        return chunks;
    };

    return (
        <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
            <div onClick={toggleExpand} style={{ cursor: 'pointer', color: '#e29743', display: 'inline-block', verticalAlign: 'top' }}>
                {isExpanded ? (
                    <div>
                        {formatKey(publicKey).map((chunk, index) => (
                            <p key={index} style={{ margin: 0 }}>{chunk}</p>
                        ))}
                        <span style={{ fontSize: '0.8em', color: '#ccc' }}>(click to shrink)</span>
                    </div>
                ) : (
                    <span>
                        {shortenedKey} <span style={{ fontSize: '0.8em', color: '#ccc' }}>(click to expand)</span>
                    </span>
                )}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ccc', padding: '2px', borderRadius: '4px', marginLeft: '10px', verticalAlign: 'top' }}>
                <img
                    src={copyButtonImage}
                    alt="Copy Address"
                    onClick={copyToClipboard}
                    style={{ cursor: 'pointer', width: '24px', height: '24px' }}
                />
            </div>
            {isCopied && <span style={{ color: '#03dac6', marginLeft: '10px', verticalAlign: 'top' }}>Copied!</span>}
        </div>
    );
}

export default PublicKeyDisplay;