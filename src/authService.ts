import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, SignUpCommand, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
import config from "./config.json";
import CryptoJS from "crypto-js";

export const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region,
});

const calculateSecretHash = (username: string, clientId: string, clientSecret: string) => {
  return CryptoJS.HmacSHA256(username + clientId, clientSecret).toString(CryptoJS.enc.Base64);
};

export const signIn = async (username: string, password: string) => {
  const secretHash = calculateSecretHash(username, config.clientId, config.clientSecret);
  const params = {
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: config.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  };
  try {
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);
    const { AuthenticationResult, ChallengeName, Session } = response;

    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
      sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
      return { token: AuthenticationResult.IdToken }; // Return the IdToken or any other token you need
    } else if (ChallengeName) {
      // Return the challenge information if a challenge is required
      return {
        ChallengeName,
        Session,
      };
    }
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const completeMfaChallenge = async (username: string, mfaCode: string, session: string) => {
  const params = {
    ClientId: config.clientId,
    ChallengeName: 'SOFTWARE_TOKEN_MFA' as const,
    Session: session,
    ChallengeResponses: {
      USERNAME: username,
      SOFTWARE_TOKEN_MFA_CODE: mfaCode,
    },
  };

  try {
    const command = new RespondToAuthChallengeCommand(params);
    const response = await cognitoClient.send(command);
    const { AuthenticationResult } = response;

    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
      sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
      return { token: AuthenticationResult.IdToken }; // Return the IdToken or any other token you need
    }
  } catch (error) {
    console.error("Error completing MFA challenge: ", error);
    throw error;
  }
};

export const associateSoftwareToken = async (session: string) => {
  const params = {
    Session: session,
  };

  try {
    const command = new AssociateSoftwareTokenCommand(params);
    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error("Error associating software token: ", error);
    throw error;
  }
};

export const verifySoftwareToken = async (session: string, userCode: string) => {
  const params = {
    Session: session,
    UserCode: userCode,
  };

  try {
    const command = new VerifySoftwareTokenCommand(params);
    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error("Error verifying software token: ", error);
    throw error;
  }
};