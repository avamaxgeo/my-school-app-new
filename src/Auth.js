import React, { useState, useEffect } from 'react';
// Changed import path to be explicitly './supabaseClient.js'
import { supabase } from './supabaseClient.js';

const Auth = () => {
  // State to manage loading status during async operations
  const [loading, setLoading] = useState(false);
  // State to manage the user's email input
  const [email, setEmail] = useState('');
  // State to manage the user's password input
  const [password, setPassword] = useState(''); // New state for password
  // State to store the current user session
  const [session, setSession] = useState(null);
  // State for displaying messages to the user
  const [message, setMessage] = useState('');

  // useEffect hook to run side effects after component renders
  useEffect(() => {
    // Function to get the current session
    const getSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error.message);
        setMessage(`Error: ${error.message}`);
      } else if (session) {
        setSession(session);
        setMessage('You are logged in.');
      } else {
        setMessage('Please log in.');
      }
      setLoading(false);
    };

    getSession(); // Call the function when the component mounts

    // Listen for changes in the authentication state (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_IN') {
          setMessage('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          setMessage('Successfully signed out!');
        }
      }
    );

    // Cleanup function: unsubscribe from the auth listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Function to handle login via email and password
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true);
    setMessage('');

    // Use the 'password' state here instead of a hardcoded value
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(`Error logging in: ${error.message}`);
      console.error('Login error:', error.message);
    } else {
      setMessage('Check your email for the login link!');
    }
    setLoading(false);
  };

  // Function to handle user logout
  const handleLogout = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`Error logging out: ${error.message}`);
      console.error('Logout error:', error.message);
    } else {
      setSession(null); // Clear the session state
      setMessage('Successfully logged out.');
    }
    setLoading(false);
  };

  // Render logic based on session state and loading state
  return (
    <div style={styles.container}>
      {loading ? (
        <p style={styles.loadingText}>Loading...</p>
      ) : (
        <>
          {session ? (
            // If session exists, show logout button
            <div style={styles.loggedInContainer}>
              <p style={styles.welcomeText}>Welcome, {session.user.email}!</p>
              <button
                onClick={handleLogout}
                style={styles.button}
                disabled={loading}
              >
                Log Out
              </button>
              {message && <p style={styles.message}>{message}</p>}
            </div>
          ) : (
            // If no session, show login form
            <form onSubmit={handleLogin} style={styles.form}>
              <h2 style={styles.formTitle}>Login for Teachers</h2>
              <p style={styles.message}>{message}</p>
              <div style={styles.inputGroup}>
                <label htmlFor="email" style={styles.label}>Email:</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              {/* New Password Input Field */}
              <div style={styles.inputGroup}>
                <label htmlFor="password" style={styles.label}>Password:</label>
                <input
                  id="password"
                  type="password" // Use type="password" for masked input
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <button
                type="submit"
                style={styles.button}
                disabled={loading}
              >
                Log In
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

// Basic inline styles (since we skipped Tailwind CSS)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
  },
  loadingText: {
    fontSize: '1.2em',
    color: '#555',
  },
  loggedInContainer: {
    textAlign: 'center',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  welcomeText: {
    fontSize: '1.5em',
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: '350px',
    maxWidth: '90%',
  },
  formTitle: {
    fontSize: '1.8em',
    marginBottom: '10px',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    color: '#d9534f',
    fontSize: '0.9em',
    textAlign: 'center',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '0.9em',
    color: '#555',
    marginBottom: '5px',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1em',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    marginTop: '10px',
    transition: 'background-color 0.3s ease',
  },
  'button:hover': {
    backgroundColor: '#0056b3',
  },
  'button:disabled': {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
};

export default Auth;