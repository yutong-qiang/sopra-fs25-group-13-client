'use client';
import { useSearchParams } from 'next/navigation';

export default function ResultsPage() {
    const params = useSearchParams();
    const votedFor = params.get('votedFor');

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <h1>Voting Results</h1>
            <p>You voted for: <strong>{votedFor}</strong></p>
            {/* You can also fetch and show total votes from server here */}
        </div>
    );
}