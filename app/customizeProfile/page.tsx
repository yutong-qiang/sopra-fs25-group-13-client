"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { message } from "antd";

const CustomizeProfile: React.FC = () => {
    const router = useRouter();
    const { value: token } = useLocalStorage<string>("token", "");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { value: id } = useLocalStorage<string>("id", "");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && selected.type === "image/jpeg") {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        } else {
            message.error("Only JPEG files are allowed.");
        }
    };

    const handleSubmit = async () => {
        if (!file || !token) {
            message.error("Missing file or token.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
        const BASE_URL = isLocal
            ? "http://localhost:8080"
            : "https://sopra-fs25-group-13-server.oa.r.appspot.com";

        try {
            const response = await fetch(`${BASE_URL}/user/avatar`, {
                method: "POST",
                headers: {
                    Authorization: token,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            message.success("Profile picture uploaded successfully!");
            router.push(`/profile/${id}`);
        } catch (error) {
            console.error(error);
            message.error("Failed to upload avatar.");
        }
    };

    return (
        <div className="home-container">
            <h1 className="text-white text-2xl font-bold mb-6">Customize Profile</h1>

            {preview && (
                <img
                    src={preview}
                    alt="Preview"
                    style={{ width: 180, height: 180, borderRadius: "50%", marginBottom: "20px" }}
                />
            )}

            <input
                type="file"
                accept="image/jpeg"
                onChange={handleFileChange}
                style={{ marginBottom: "20px" }}
            />

            <div>
                <button className="home-button mr-4" onClick={handleSubmit}>Save</button>
                <button className="home-button" onClick={() => router.push(`/profile/${id}`)}>Cancel</button>
            </div>
        </div>
    );
};

export default CustomizeProfile;