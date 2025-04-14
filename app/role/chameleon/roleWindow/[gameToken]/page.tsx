"use client";

import {useParams, useRouter} from "next/navigation";
import "@/styles/home.css";
/*import useLocalStorage from "@/hooks/useLocalStorage";*/
import {useEffect} from "react";

const Chameleon: React.FC = () => {
    const router = useRouter();
    const { gameToken } = useParams();
    /*const { value: id } = useLocalStorage<string>("id", "");*/

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.push(`/role/chameleon/${gameToken}`);
        }, 10000); //10 seconds

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="home-container">
            <div className="chameleon-box">
                <h1 className="chameleon-title">YOU ARE</h1>
                <h1 className="chameleon-subtitle">THE <span className="highlight">CHAMELEON</span>!</h1>
            </div>
        </div>
    );
};

export default Chameleon;