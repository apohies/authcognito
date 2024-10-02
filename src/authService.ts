// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
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
    const { AuthenticationResult } = await cognitoClient.send(command);
    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || '');
      sessionStorage.setItem("refreshToken", AuthenticationResult.RefreshToken || '');
      return AuthenticationResult;
    }
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  const secretHash = calculateSecretHash(email, config.clientId, config.clientSecret);
  const params = {
    ClientId: config.clientId,
    Username: email,
    Password: password,
    SecretHash: secretHash,
    
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };
  try {
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);
    console.log("Sign up success: ", response);
    return response;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};

export const confirmSignUp = async (username: string, code: string) => {
  const secretHash = calculateSecretHash(username, config.clientId, config.clientSecret);
  const params = {
    ClientId: config.clientId,
    Username: username,
    ConfirmationCode: code,
    SecretHash: secretHash,
  };
  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    console.log("User confirmed successfully");
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};
