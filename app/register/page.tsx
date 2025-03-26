"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import styles from "@/styles/page.module.css";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface RegisterFormFields {
  username: string;
  password: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    set: setToken,
  } = useLocalStorage<string>("token", ""); 

  const handleRegister = async (values: RegisterFormFields) => {
    try {
      const response = await apiService.post<User>("/users", values);

      if (response && response.token) {
        setToken(response.token);
        router.push("/users");
      }
      else {
        throw new Error("Registration failed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the registration:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during registration.");
        alert("Registration failed: Unknown Error.")
      }
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ 
        background: 'linear-gradient(145deg, #75bd9d 0%, #4a9276 100%)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '400px'
      }}>
        <Form
          form={form}
          name="register"
          size="large"
          onFinish={handleRegister}
          layout="vertical"
          style={{ width: "100%" }}
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                <span>USERNAME</span>
                <span style={{ color: 'white' }}>*</span>
              </div>
            }
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input 
              placeholder="Enter username"
              style={{ 
                height: '45px',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: 'none'
              }} 
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                <span>PASSWORD</span>
                <span style={{ color: 'white' }}>*</span>
              </div>
            }
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password 
              placeholder="Enter password"
              style={{ 
                height: '45px',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#1a1a1a',
                '.ant-input': {
                  backgroundColor: '#1a1a1a',
                  color: 'white'
                },
                border: 'none'
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button 
                onClick={() => router.push('/')} 
                style={{ 
                  flex: 1,
                  height: '45px',
                  borderRadius: '8px',
                  background: '#5DC499',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                RETURN
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ 
                  flex: 1,
                  height: '45px',
                  borderRadius: '8px',
                  background: '#5DC499',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              >
                REGISTER
              </Button>
            </div>
          </Form.Item>
        </Form>
      </main>
    </div>
  );
};

export default Register;