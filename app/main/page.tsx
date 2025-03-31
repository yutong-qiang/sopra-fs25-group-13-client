"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/page.module.css";
import useLocalStorage from "@/hooks/useLocalStorage";
/*import { useApi } from "@/hooks/useApi";*/
import { useEffect, useState } from "react";
import "@/styles/home.css";

const Main: React.FC = () => {
    const router = useRouter();
    const { value: token } = useLocalStorage<string>("token", "");
    /*const apiService = useApi();*/
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!token) {
                router.push("/login");
            }
            setIsLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [token, router]);

    /*const handleProfileClick = async () => {
        try {
            // Assuming the token is already available in your localStorage or state
            const token = localStorage.getItem('token'); // Or use state where the token is stored

            if (!token) {
                message.error("No token found. Please log in.");
                router.push("/login");
                return;
            }

            // Fetch user info using token (assuming the token is set properly in headers or elsewhere)
            const userResponse = await apiService.get<{ username: string }>("/users/me", {
                headers: {
                    Authorization: `Bearer ${token}`, // Pass the token in the header for authentication
                },
            });

            if (userResponse?.username) {
                // Navigate to the user's profile page using the fetched username
                router.push(`/profile/${userResponse.username}`);
            } else {
                message.error("Invalid user data.");
                router.push("/login");
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            message.error("Failed to fetch user data.");
            router.push("/login");
        }
    };*/


    if (isLoading) {
        return (
            <div className={styles.page}>
                <main className={styles.main} style={{ background: "linear-gradient(145deg, #75bd9d 0%, #4a9276 100%)", padding: "40px", borderRadius: "20px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", width: "400px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", justifyContent: "center" }}>
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
                    <button onClick={() => router.push("/gamesession/join")} className="home-button">
                        JOIN GAME SESSION
                    </button>
                    <button onClick={() => router.push("/gamesession/create")} className="home-button">
                        CREATE GAME SESSION
                    </button>
                    <button
                        onClick={() => router.push("/profile/${user.username}")}
                        className="home-button"
                    >
                        PROFILE
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
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