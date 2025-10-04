// In file: my-v0-project/app/page.tsx
'use client'; // This line is required for components that use hooks

import useSWR from 'swr';

// This is a helper function that SWR will use to fetch data.
// We've customized it to send our login token for authorization.
const fetcher = (url: string) => {
    // In a real application, you would get this token from local storage
    // after the user logs in. For testing now, we will get it manually.
    const token = 'PASTE_YOUR_JWT_TOKEN_HERE';

    if (!token || token === 'PASTE_YOUR_JWT_TOKEN_HERE') {
        throw new Error('Authentication token is missing. Please log in with Postman and paste the token.');
    }

    return fetch(url, {
        headers: {
            'x-auth-token': token,
        },
    }).then((res) => {
        // If the server responds with an error, throw an error
        if (!res.ok) {
            throw new Error('Failed to fetch data from the server.');
        }
        return res.json();
    });
};


export default function DashboardPage() {
    // Here we tell SWR to fetch data from our backend summary endpoint
    const { data, error, isLoading } = useSWR('http://localhost:5000/api/expenses/summary', fetcher);

    // Display a message if there's an error
    if (error) return <div>Failed to load dashboard data: {error.message}</div>;
    
    // Display a loading message while data is being fetched
    if (isLoading) return <div>Loading dashboard...</div>;

    // Once data is loaded, display it
    return (
        <main className="p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* My Expenses Card - Now powered by your backend! */}
                <div className="bg-yellow-100 border border-yellow-300 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">My Expenses</h2>
                    <p className="text-4xl font-bold">{data.expense_count}</p>
                    <p className="text-gray-600">Total: ${parseFloat(data.total_amount).toFixed(2)}</p>
                </div>

                {/* Placeholder for Pending Approvals Card */}
                <div className="bg-teal-100 border border-teal-300 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Pending Approvals</h2>
                    <p className="text-4xl font-bold">--</p>
                    <p className="text-gray-600">Total: $0.00</p>
                </div>
            </div>
        </main>
    );
}