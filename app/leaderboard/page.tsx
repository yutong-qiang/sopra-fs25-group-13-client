"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
    id: string;
    username: string;
    wins: number;
    roundsPlayed: number;
    avatar: string;
    winRate: number;
}

const LeaderboardPage: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
            try {
                const response = await fetch(`${isLocal
                    ? 'http://localhost:8080'
                    : 'https://sopra-fs25-group-13-server.oa.r.appspot.com'}/leaderboard`);
                const data = await response.json();
                setLeaderboard(data);
            } catch (error) {
                console.error("Failed to load leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return <p className="text-white text-center mt-8">Loading leaderboard...</p>;
    }

    return (
        <div className="home-container">
            <main className="button-container w-[400px] max-h-[300px] mx-auto text-white">
                <h1 className="text-3xl font-bold mb-6 text-center underline" style={{ color: "white", fontSize: "32px", fontWeight: "bold", textAlign: "center", marginBottom: "20px", borderBottom: '2px solid white' }}>
                    Leaderboard
                </h1>
                {leaderboard.length === 0 ? (
                    <p>No data available.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="leaderboard-table">
                            <thead>
                            <tr className="border-b">
                                <th>Rank</th>
                                <th>Avatar</th>
                                <th>Player</th>
                                <th>Wins</th>
                                <th>Win Rate</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leaderboard.map((entry, index) => (
                                <tr key={entry.id} className="border-b py-2">
                                    <td>{index + 1}</td>
                                    <td>
                                        <img
                                            src={entry.avatar ? `data:image/jpeg;base64,${entry.avatar}` : "/chameleon.png"}
                                            alt="Avatar"
                                            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                            onError={(e) => {
                                                e.currentTarget.src = "/chameleon.png"; // fallback to default image
                                            }}
                                        />
                                    </td>
                                    <td>{entry.username}</td>
                                    <td>{entry.wins}</td>
                                    <td>{(entry.winRate * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-6 text-center">
                    <button
                        className="home-button"
                        onClick={() => router.push("/main")}
                    >
                        Back to Menu
                    </button>
                </div>
            </main>
        </div>
    );
};

export default LeaderboardPage;