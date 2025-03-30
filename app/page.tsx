"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import "@/styles/home.css";

const Home: React.FC = () => {
    const router = useRouter();

    return (
        <div className="home-container">
            {/* Logo */}
            <div className="logo-container">
                <Image src="/chameleon-homepage-icon.png" alt="Chameleon Logo" width={300} height={180} />
            </div>

            {/* Buttons */}
            <div className="button-container">
                <button onClick={() => router.push("/login")} className="home-button">
                    LOGIN
                </button>
                <button onClick={() => router.push("/register")} className="home-button">
                    REGISTER
                </button>
            </div>
        </div>
    );
};

export default Home;