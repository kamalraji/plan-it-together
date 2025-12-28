# Certificate Service

This service handles certificate generation, distribution, and verification for the Thittam1Hub platform.

## Features

### 1. Certificate Generation
- Generates high-resolution PDF certificates
- Supports three certificate types:
  - **MERIT**: For competition winners (includes rank and score)
  - **COMPLETION**: For event participants who completed the event
  - **APPRECIATION**: For volunteers, judges, and speakers (includes role)
- Each certificate includes:
  - Unique certificate ID (cryptographically secure)
  - Recipient name and event details
  - QR code for verification
  - Professional design with event branding

### 2. Certificate Criteria Management
- Define criteria for automatic certificate generation
- Criteria can include:
  - Minimum score requirements
  - Maximum rank (for merit certificates)
  - Attendance requirements
  - Role requirements (for appreciation certificates)

### 3. Batch Generation
- Automatically generate certificates for all eligible participants
- Based on predefined criteria
- Processes registrations, attendance, and judging data

### 4. Certificate Verification
- Public verification portal (no authentication required)
- Scan QR code or enter certificate ID
- Returns certificate details if valid
- Prevents certificate fraud

### 5. Certificate Distribution
- Email certificates to recipients as PDF attachments
- Track distribution status
- Retry failed deliveries
- Log all distribution attempts

## API Endpoints

### Store Certificate Criteria
```
POST /api/certificates/criteria
Authorization: Bearer <token> (Organizer only)

Body:
{
  "eventId": "event-123",
  "criteria": [
    {
      "type": "MERIT",
      "conditions": {
        "maxRank": 3,
        "requiresAttendance": true
      }
    },
    {
      "type": "COMPLETION",
      "conditions": {
        "requiresAttendance": true
      }
    }
  ]
}
```

### Generate Single Certificate
```
POST /api/certificates/generate
Authorization: Bearer <token> (Organizer only)

Body:
{
  "recipientId": "user-123",
  "eventId": "event-123",
  "type": "COMPLETION",
  "metadata": {
    "eventName": "Tech Conference 2024",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com",
    "issueDate": "2024-12-01T00:00:00Z"
  }
}
```

### Batch Generate Certificates
```
POST /api/certificates/batch-generate
Authorization: Bearer <token> (Organizer only)

Body:
{
  "eventId": "event-123"
}
```

### Distribute Certificates
```
POST /api/certificates/distribute
Authorization: Bearer <token> (Organizer only)

Body:
{
  "certificateIds": ["cert-1", "cert-2", "cert-3"]
}
```

### Verify Certificate (Public)
```
GET /api/certificates/verify/:certificateId
No authentication required

Response:
{
  "success": true,
  "data": {
    "certificateId": "CERT-ABC123",
    "recipientName": "John Doe",
    "eventName": "Tech Conference 2024",
    "type": "COMPLETION",
    "issuedAt": "2024-12-01T00:00:00Z"
  }
}
```

### Get User Certificates
```
GET /api/certificates/user/:userId
Authorization: Bearer <token>
```

### Get Event Certificates
```
GET /api/certificates/event/:eventId
Authorization: Bearer <token> (Organizer only)
```

## Storage

Certificates and QR codes are stored in the file system:
- Certificates: `storage/certificates/`
- QR Codes: `storage/qr-codes/`

These directories are served as static files via `/storage` endpoint.

## Security

- Certificate IDs are cryptographically secure (using crypto.randomBytes)
- Verification portal is public but rate-limited to prevent enumeration
- Only organizers can generate and distribute certificates
- Users can only access their own certificates

## Testing

Unit tests are located in `__tests__/certificate.service.test.ts`

Run tests:
```bash
npm test certificate.service
```

## Future Enhancements

- Email service integration (SendGrid/AWS SES)
- Custom certificate templates
- Bulk download as ZIP
- Certificate revocation
- Digital signatures
- Blockchain verification
