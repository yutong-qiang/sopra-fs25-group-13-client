"use client";

import { useRouter } from "next/navigation";
import "@/styles/home.css";
/*import useLocalStorage from "@/hooks/useLocalStorage";*/


const ChameleonWin: React.FC = () => {
    const router = useRouter();
    /*const { value: id } = useLocalStorage<string>("id", "");*/


    return (
        <div className="home-container">
            <div className="chameleon-box">
                <h1 className="chameleon-title">THE</h1>
                <h1 className="highlight">CHAMELEON</h1>
                <h1 className="chameleon-title">WINS!</h1>
            </div>
            <div className="flex justify-center mt-10">
                <button
                    onClick={() => router.push(`/main`)}
                    className="home-button"
                >
                    RETURN
                </button>
            </div>
        </div>
    );
};

export default ChameleonWin;