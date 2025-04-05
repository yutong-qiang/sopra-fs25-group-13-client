"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
//testing M2 

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import "@/styles/home.css";

interface LoginFormFields {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we do not need the token value
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    // clear: clearToken, // is commented out because we do not need to clear the token when logging in
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  const handleLogin = async (values: LoginFormFields) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      const response = await apiService.post<User>("/login", values);

      // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
      if (response && response.token) {
        await setToken(response.token);
        // Add a small delay to ensure the token is set in localStorage
        setTimeout(() => {
          router.push("/main");
        }, 100);
      }
      else {
        throw new Error("Login failed.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during login.");
        alert("Login failed: Unknown Error.")
      }
    }
  };

  return (
    <div className="home-container">
      <main className="button-container">
        <Form
          form={form}
          name="login"
          size="large"
          onFinish={handleLogin}
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
                color: 'white',
                border: 'none'
              }} 
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button 
                onClick={() => router.push('/')}
                type="primary"
                className="home-button"
              >
                RETURN
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className="home-button"
              >
                LOGIN
              </Button>
            </div>
          </Form.Item>
        </Form>
      </main>
    </div>
  );
};

export default Login;
