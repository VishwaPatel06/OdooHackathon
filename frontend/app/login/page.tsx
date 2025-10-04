'use client';

import useSWR from 'swr';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The fetcher function now reads the token from localStorage
const fetcher = (url: string) => {
    // Get the token from the browser's local storage
    const token = localStorage.getItem('token');

    // If there's no token, the user is not logged in.
    // We throw an error to stop the request.
    if (!token) {
        throw new Error('Not authorized. No token found.');
    }

    return fetch(url, {
        headers: {
            'x-auth-token': token,
        },
    }).then((res) => {
        if (res.status === 401) {
            // If the token is invalid or expired
            throw new Error('Token is not valid. Please log in again.');
        }
        if (!res.ok) {
            throw new Error('An error occurred while fetching the data.');
        }
        return res.json();
    });
};


export default function DashboardPage() {
    const router = useRouter();
    const { data, error, isLoading } = useSWR('http://localhost:5000/api/expenses/summary', fetcher);

    // This effect will run if the fetcher throws an error (e.g., no token)
    useEffect(() => {
        if (error) {
            // If there is any error fetching data (like no token),
            // redirect the user to the login page.
            router.push('/login');
        }
    }, [error, router]);

    if (isLoading) return <div>Loading dashboard...</div>;
    // Don't show an error message here, as the useEffect will redirect
    if (!data) return null;


    return (
        <main className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-yellow-100 border border-yellow-300 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">My Expenses</h2>
                    <p className="text-4xl font-bold">{data.expense_count}</p>
                    <p className="text-gray-600">Total: ${parseFloat(data.total_amount).toFixed(2)}</p>
                </div>
                <div className="bg-teal-100 border border-teal-300 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Pending Approvals</h2>
                    <p className="text-4xl font-bold">--</p>
                    <p className="text-gray-600">Total: $0.00</p>
                </div>
            </div>
        </main>
    );
}