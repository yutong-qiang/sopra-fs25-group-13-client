"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Spin, message } from "antd";
import "@/styles/home.css";

const Profile: React.FC = () => {
    const router = useRouter();
    const { id } = useParams();
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");
    const { value: localId } = useLocalStorage<string>("id", "");
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    /*const [unauthorized, setUnauthorized] = useState(false);*/
    const avatarSrc = user?.avatar
        ? `data:image/jpeg;base64,${user.avatar}`
        : "/chameleon.png";

    useEffect(() => {

        const fetchUser = async () => {
            try {
                const response = await apiService.get<User>(`/users/${id}`);
                if (response) {
                    setUser(response);
                } else {
                    throw new Error("User not found");
                }
            } catch {
                message.error("Failed to fetch user profile.");
                /*setUnauthorized(true);*/
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, token, apiService, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!token) {
                router.push("/login");
            }
            setLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [token, router]);

    if (loading) {
        return <Spin size="large" className="loading-spinner" />;
    }

    if (!token) {
        return null;
    }

    if (id !== localId) {
        //message.error("Access denied. You can only view your own profile.");
        router.push("/main");
        return;
    }

    return (
        <div className="home-container">
            <div className="button-container">
                <img
                    src={avatarSrc}
                    alt="User Avatar"
                    width={180}
                    height={180}
                    style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginBottom: "20px",
                    }}
                    onError={(e) => {
                        e.currentTarget.src = "/chameleon.png"; // fallback to default
                    }}
                />
                <h1 className="text-white text-2xl font-bold mt-4 underline" style={{ color: "white", fontSize: "32px", fontWeight: "bold", textAlign: "center", marginBottom: "20px", borderBottom: '2px solid white' }}>{user?.username}</h1>
                <p className="text-white text-xl font-semibold mt-6" style={{ color: "white", fontSize: "16px", fontWeight: "bold", textAlign: "center" }}>
                    GAMES PLAYED: {user?.roundsPlayed || 0}
                </p>
                <p className="text-white text-xl font-semibold" style={{ color: "white", fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "20px" }}>
                    GAMES WON: {user?.wins || 0}
                </p>
                <div className="flex justify-around mt-8">
                    <button
                        className="home-button"
                        onClick={() => router.push("/customizeProfile")}
                    >
                        CUSTOMIZE
                    </button>
                    <button
                        className="home-button"
                        onClick={() => router.push("/main")}
                    >
                        RETURN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
