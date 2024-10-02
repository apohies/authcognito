import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeComponentProps {
  secretCode: string;
}

const QRCodeComponent: React.FC<QRCodeComponentProps> = ({ secretCode }) => {
  const otpauthUrl = `otpauth://totp/YourAppName?secret=${secretCode}&issuer=YourAppName`;

  return (
    <div>
      <h1>Scan this QR code with your authenticator app:</h1>
      <QRCode value={otpauthUrl} />
    </div>
  );
};

export default QRCodeComponent;