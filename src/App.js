    import React, { useState, useEffect } from 'react';
    import Auth from './Auth'; // Import the Auth component
    import Students from './Students'; // Import the new Students component
    import { supabase } from './supabaseClient'; // Import supabase client for session check in App.js

    function App() {
      const [session, setSession] = useState(null);

      useEffect(() => {
        // Set initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
        });

        // Listen for auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });

        // Cleanup the subscription
        return () => subscription.unsubscribe();
      }, []);

      return (
        <div className="App">
          {!session ? (
            // If no session, show the Auth component for login
            <Auth />
          ) : (
            // If there's a session, show the Students component and pass the session
            <Students session={session} />
          )}
        </div>
      );
    }

    export default App;