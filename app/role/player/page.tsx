"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/home.css";
/*import useLocalStorage from "@/hooks/useLocalStorage";*/

const Player: React.FC = () => {
    /*const { value: id } = useLocalStorage<string>("id", "");*/
    const [secretWord, setSecretWord] = useState("");
    const router = useRouter();

    useEffect(() => {
        const words = ["BUTTERFLY", "JUNGLE", "CHAMELEON", "PYTHON", "TIGER"];
        const randomIndex = Math.floor(Math.random() * words.length);
        setSecretWord(words[randomIndex]);

        const timeout = setTimeout(() => {
            router.push(`/main`);
        }, 10000); //10 seconds

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="home-container">
            <div className="button-container">
                <h1 className="chameleon-title">THE SECRET WORD IS:</h1>
                <h1 className="highlight">{secretWord}</h1>
            </div>
        </div>
    );
};

export default Player;