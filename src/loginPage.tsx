import React, { useState } from 'react';
import { signIn, completeMfaChallenge, associateSoftwareToken, verifySoftwareToken } from './authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [session, setSession] = useState(null);
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [isMfaSetup, setIsMfaSetup] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const handleSignIn = async () => {
    try {
      const response = await signIn(email, password);

      if (response.token) {
        // Handle successful sign-in
        console.log('Sign-in successful, token:', response.token);
        // Store the token or proceed with authenticated actions
      } else if (response.ChallengeName) {
        // Handle the challenge
        console.log('Challenge required:', response.ChallengeName);
        if (response.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
          setSession(response.Session);
          setIsMfaRequired(true);
        } else if (response.ChallengeName === 'MFA_SETUP') {
          const mfaResponse = await associateSoftwareToken(response.Session);
          setSecretCode(mfaResponse.SecretCode);
          setSession(mfaResponse.Session);
          setIsMfaSetup(true);
        }
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  const handleCompleteMfa = async () => {
    try {
      const response = await completeMfaChallenge(email, mfaCode, session);
      if (response.token) {
        console.log('MFA successful, token:', response.token);
        // Store the token or proceed with authenticated actions
      }
    } catch (error) {
      console.error('Error completing MFA challenge:', error);
    }
  };

  const handleVerifyMfa = async () => {
    try {
      const response = await verifySoftwareToken(session, mfaCode);
      if (response.Status === 'SUCCESS') {
        console.log('MFA setup successful');
        // Proceed with authenticated actions
      }
    } catch (error) {
      console.error('Error verifying MFA setup:', error);
    }
  };

  return (
    <div>
      {!isMfaRequired && !isMfaSetup ? (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button onClick={handleSignIn}>Sign In</button>
        </>
      ) : isMfaRequired ? (
        <>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="Enter MFA code"
          />
          <button onClick={handleCompleteMfa}>Submit MFA Code</button>
        </>
      ) : (
        <>
          <p>Scan this QR code with your authenticator app: {secretCode}</p>
          <input
            type="text"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="Enter code from authenticator app"
          />
          <button onClick={handleVerifyMfa}>Verify MFA Setup</button>
        </>
      )}
    </div>
  );
};

export default LoginPage;