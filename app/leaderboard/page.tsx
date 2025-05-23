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
    const colWidths = {
        rank: "120px",
        avatar: "120px",
        player: "120px",
        wins: "120px",
        winRate: "120px",
    };

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
            <main className="button-container">
                <h1
                    style={{
                        color: "white",
                        fontSize: "32px",
                        fontWeight: "bold",
                        textAlign: "center",
                        marginBottom: "20px",
                        borderBottom: "2px solid white",
                        paddingBottom: "8px",
                    }}
                >
                    Leaderboard
                </h1>

                {leaderboard.length === 0 ? (
                    <p>No data available.</p>
                ) : (
                    <>
                        {/* Header table */}
                        <table
                            className="leaderboard-table"
                            style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}
                        >
                            <thead>
                            <tr>
                                <th style={{ width: colWidths.rank }}>Rank</th>
                                <th style={{ width: colWidths.avatar }}>Avatar</th>
                                <th style={{ width: colWidths.player }}>Player</th>
                                <th style={{ width: colWidths.wins }}>Wins</th>
                                <th style={{ width: colWidths.winRate }}>Win Rate</th>
                            </tr>
                            </thead>
                        </table>

                        {/* Scrollable body container */}
                        <div
                            className="table-wrapper"
                            style={{
                                height: "345px",
                                overflowY: "auto",
                                width: "100%",
                            }}
                        >
                            <table
                                className="leaderboard-table"
                                style={{ width: "100%", borderCollapse: "collapse" }}
                            >
                                <tbody>
                                {leaderboard.map((entry, index) => (
                                    <tr key={entry.id}>
                                        <td style={{ width: colWidths.rank }}>{index + 1}</td>
                                        <td style={{ width: colWidths.avatar }}>
                                            <img
                                                src={entry.avatar ? `data:image/jpeg;base64,${entry.avatar}` : "/chameleon.png"}
                                                alt="Avatar"
                                                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                                onError={(e) => {
                                                    e.currentTarget.src = "/chameleon.png";
                                                }}
                                            />
                                        </td>
                                        <td style={{ width: colWidths.player }}>{entry.username}</td>
                                        <td style={{ width: colWidths.wins }}>{entry.wins}</td>
                                        <td style={{ width: colWidths.winRate }}>{(entry.winRate * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <button className="home-button" onClick={() => router.push("/main")}>
                        Back to Menu
                    </button>
                </div>
            </main>
        </div>
    );
};

export default LeaderboardPage;