"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import styles from "@/styles/page.module.css";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useEffect, useState } from "react";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

const Main: React.FC = () => {
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure we have the latest token value
    const timer = setTimeout(() => {
      if (!token) {
        router.push("/login");
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [token, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.page}>
        <main className={styles.main} style={{ 
          background: 'linear-gradient(145deg, #75bd9d 0%, #4a9276 100%)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '24px', 
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Loading...
          </h1>
        </main>
      </div>
    );
  }

  // If there's no token after loading, don't render anything while redirecting
  if (!token) {
    return null;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ 
        background: 'linear-gradient(145deg, #75bd9d 0%, #4a9276 100%)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '32px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          Welcome to Chameleon
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={() => router.push('/gamesession/join')}
            style={{ 
              height: '60px',
              borderRadius: '8px',
              background: '#5DC499',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            JOIN GAME SESSION
          </button>
          <button 
            onClick={() => router.push('/gamesession/create')}
            style={{ 
              height: '60px',
              borderRadius: '8px',
              background: '#5DC499',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            CREATE GAME SESSION
          </button>
          <button 
            onClick={() => router.push('/profile')}
            style={{ 
              height: '60px',
              borderRadius: '8px',
              background: '#5DC499',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            PROFILE
          </button>
          <button 
            onClick={() => router.push('/profile')}
            style={{ 
              height: '60px',
              borderRadius: '8px',
              background: '#5DC499',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            LOGOUT
          </button>
        </div>
      </main>
    </div>
  );
};

export default Main;