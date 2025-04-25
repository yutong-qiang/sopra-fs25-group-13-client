"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import "@/styles/home.css";
import { useEffect } from "react";

const RoleWindow: React.FC = () => {
    const router = useRouter();
    const { gameToken } = useParams();
    const searchParams = useSearchParams();
    const isChameleon = searchParams.get('isChameleon') === 'true';
    const secretWord = searchParams.get('word');

    useEffect(() => {
        // Ensure we have an active game session
        if (!localStorage.getItem('gameSessionActive')) {
            router.push(`/game/join/${gameToken}`);
            return;
        }

        const timeout = setTimeout(() => {
            // Keep the session active when returning
            localStorage.setItem('gameSessionActive', 'true');
            router.push(`/game/join/${gameToken}`);
        }, 10000); // 10 seconds

        return () => clearTimeout(timeout);
    }, [router, gameToken]);

    return (
        <div className="home-container">
            {isChameleon ? (
                <div className="chameleon-box">
                    <h1 className="chameleon-title">YOU ARE</h1>
                    <h1 className="chameleon-subtitle">THE <span className="highlight">CHAMELEON</span>!</h1>
                </div>
            ) : (
                <div className="button-container">
                    <h1 className="chameleon-title">THE SECRET WORD IS:</h1>
                    <h1 className="highlight">{secretWord}</h1>
                </div>
            )}
        </div>
    );
};

export default RoleWindow;