import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function DeliveryTimer({ estimatedDeliveryTime, status }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        if (!estimatedDeliveryTime || status === 'Delivered') return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const target = new Date(estimatedDeliveryTime).getTime();
            const difference = target - now;

            if (difference < 0) {
                setIsLate(true);
                setTimeLeft('Arriving any moment...');
                return;
            }

            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft(`${minutes}m ${seconds}s`);
            setIsLate(false);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [estimatedDeliveryTime, status]);

    if (!estimatedDeliveryTime || status !== 'Out for Delivery') return null;

    return (
        <div style={{
            background: isLate ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isLate ? '#ef4444' : '#10b981'}`,
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            width: 'fit-content'
        }}>
            {isLate ? <AlertTriangle size={16} color="#ef4444" /> : <Clock size={16} color="#10b981" />}
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                    {isLate ? 'Running Late' : 'Arriving In'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: isLate ? '#ef4444' : '#10b981' }}>
                    {timeLeft}
                </div>
            </div>
        </div>
    );
}
