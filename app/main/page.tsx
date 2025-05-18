"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/page.module.css";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
import "@/styles/home.css";

const Main: React.FC = () => {
    const router = useRouter();
    const { value: token } = useLocalStorage<string>("token", "");
    const { value: id } = useLocalStorage<string>("id", "");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('reset') === 'true') {
            window.location.replace('/main');
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!token) {
                router.push("/login");
            }
            setIsLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [token, router]);

    if (isLoading) {
        return (
            <div className={styles.page}>
                <main
                    className={styles.main}
                    style={{
                        background: "linear-gradient(145deg, #75bd9d 0%, #4a9276 100%)",
                        padding: "40px",
                        borderRadius: "20px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        width: "400px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <h1 style={{ color: "white", fontSize: "24px", fontWeight: "bold", textAlign: "center" }}>
                        Loading...
                    </h1>
                </main>
            </div>
        );
    }

    if (!token) {
        return null;
    }

    return (
        <div className="home-container">
            <main className="button-container">
                <h1 style={{ color: "white", fontSize: "32px", fontWeight: "bold", textAlign: "center", marginBottom: "20px" }}>
                    Welcome to Chameleon
                </h1>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <button onClick={() => router.push("/game/join")} className="home-button">
                        JOIN GAME SESSION
                    </button>
                    <button onClick={() => router.push("/game")} className="home-button">
                        CREATE GAME SESSION
                    </button>
                    <button
                        onClick={() => {
                            router.push(`/profile/${id}`);
                        }}
                        className="home-button"
                    >
                        PROFILE
                    </button>
                    <button
                        className="home-button"
                        onClick={() => router.push("/rules")}
                    >
                        RULES
                    </button>
                    <button
                        className="home-button"
                        onClick={() => router.push("/leaderboard")}
                    >
                        LEADERBOARD
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("id");
                            router.push("/");
                        }}
                        className="home-button"
                    >
                        LOGOUT
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Main;