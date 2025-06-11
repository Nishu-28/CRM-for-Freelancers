# Firestore Security Rules Deployment

This project includes Firestore security rules that ensure users can only access their own data.

## Security Rules

The rules are defined in `firestore.rules` and include:

- **Clients Collection**: Users can only read, write, and create clients that belong to them (userId matches their auth.uid)
- **Invoices Collection**: Users can only read, write, and create invoices that belong to them (userId matches their auth.uid)

## Deployment Steps

### Option 1: Using Firebase CLI

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database
4. Click on the "Rules" tab
5. Copy the contents of `firestore.rules`
6. Paste them into the rules editor
7. Click "Publish"

## Rules Explanation

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own clients
    match /clients/{clientId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow users to read and write their own invoices
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

- `request.auth != null`: Ensures the user is authenticated
- `request.auth.uid == resource.data.userId`: For read/write operations, ensures the user owns the document
- `request.auth.uid == request.resource.data.userId`: For create operations, ensures the user is setting themselves as the owner

## Testing Rules

You can test the security rules in the Firebase Console:

1. Go to Firestore Database > Rules
2. Click "Rules playground"
3. Test different scenarios to ensure your rules work as expected

## Security Best Practices

- Always validate data on the server side
- Use the least privilege principle
- Test rules thoroughly before deployment
- Monitor Firestore usage and adjust rules as needed 