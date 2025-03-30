/*"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Card, Spin, Button, message } from "antd";

const Profile: React.FC = () => {
    const router = useRouter();
    const { id } = useParams(); // Get the dynamic user ID from the URL
    const apiService = useApi();
    const { value: token } = useLocalStorage<string>("token", "");
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            message.warning("You must be logged in to access this page.");
            router.push("/login");
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await apiService.get<User>(`/users/${id}`);
                setUser(response);
            } catch (error) {
                message.error("Failed to fetch user profile.");
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, token, apiService, router]);

    if (loading) {
        return <Spin size="large" className="loading-spinner" />;
    }

    if (!user || user.id.toString() !== id) {
        message.error("Unauthorized access.");
        router.push("/login");
        return null;
    }

    return (
        <div className="profile-container">
            <Card title="User Profile" bordered className="profile-card">
                <p><strong>Username:</strong> {user.username}</p>
                <Button type="primary" onClick={() => router.push("/")}>Go Home</Button>
            </Card>
        </div>
    );
};

export default Profile;
*/
