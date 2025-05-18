"use client";

import { useRouter } from "next/navigation";
import "@/styles/home.css";

const Rules: React.FC = () => {
    const router = useRouter();

    return (
        <div className="home-container">
            <div className="button-container">
                <h1 className="text-center text-3xl font-extrabold underline mb-8">RULES</h1>

                <ol className="space-y-6 text-lg font-medium">
                    <li>
                        <span className="font-bold">Setup:</span>
                        <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                            <li>Each round, all players except one receive the same word or phrase.</li>
                            <li>One person (the “Chameleon”) does not receive the word.</li>
                        </ul>
                    </li>
                    <li>
                        <span className="font-bold">Gameplay:</span>
                        <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                            <li>Players take turns giving one-word clues related to the secret word without revealing it outright.</li>
                            <li>The Chameleon must blend in and give a believable clue without knowing the actual word.</li>
                        </ul>
                    </li>
                    <li>
                        <span className="font-bold">Finding the Chameleon:</span>
                        <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                            <li>After everyone gives a clue, players discuss and vote on who they think is the Chameleon.</li>
                            <li>If caught, the Chameleon can still win by correctly guessing the secret word.</li>
                        </ul>
                    </li>
                </ol>

                <div className="flex justify-center mt-10">
                    <button
                        onClick={() => router.push('/main')}
                        className="home-button"
                    >
                        RETURN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Rules;
