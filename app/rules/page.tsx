"use client";

import { useRouter } from "next/navigation";
import "@/styles/home.css";

const Rules: React.FC = () => {
    const router = useRouter();

    return (
        <div className="home-container">
            <div className="button-container rules-container">
                <h1 className="text-3xl font-extrabold underline mb-8" style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "20px", borderBottom: '2px solid white' }}>
                    RULES
                </h1>

                <ol>
                    <li>
                        <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>1. Setup:</div>
                        <ul>
                            <li>Each round, all players except one receive the same word or phrase.</li>
                            <li>One person (the “Chameleon”) does not receive the word.</li>
                        </ul>
                    </li>
                    <li>
                        <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>2. Gameplay:</div>
                        <ul>
                            <li>Players take turns giving one-word clues related to the secret word without revealing it outright.</li>
                            <li>The Chameleon must blend in and give a believable clue without knowing the actual word.</li>
                        </ul>
                    </li>
                    <li>
                        <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>3. Finding the Chameleon:</div>
                        <ul>
                            <li>After everyone gives a clue, players discuss and vote on who they think is the Chameleon.</li>
                            <li>If caught, the Chameleon can still win by correctly guessing the secret word.</li>
                        </ul>
                    </li>
                </ol>

                <div style={{ marginTop: "40px" }}>
                    <button onClick={() => router.push('/main')} className="home-button">
                        RETURN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Rules;
