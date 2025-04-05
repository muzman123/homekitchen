"use client"
import { useState, useEffect } from 'react';

export default function HealthCheck() {
    const [health, setHealth] = useState('Loading...');
    
    useEffect(() => {
        fetch(process.env.NEXT_PUBLIC_API_URL)  // Adjust port if needed
            .then(response => response.text())
            .then(data => setHealth(data))
            .catch(error => setHealth('Error checking health'));
    }, []);
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-xl font-bold text-gray-800">API Status</h1>
                <p className="mt-2 text-green-600 font-semibold">{health}</p>
            </div>
        </div>
    );
}