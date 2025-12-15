## Interior Designer AI

![Interior design image](public/app-screenshot.png)

## How to use

### 1. Clone this project's repository

In your Terminal app

- Type `git clone git@github.com:siegblink/interior-designer-ai.git`
- Or type `git clone https://github.com/siegblink/interior-designer-ai.git`

### 2. Install the project dependencies

Go to the project's directory

- Type `cd interior-designer-ai`
- Then, `npm install`

### 3. Create an account at [replicate](https://replicate.com/)

![create-account-in-replicate](public/create-account-in-replicate.png)

### 4. Go to the _API tokens_ page within your replicate account

![go-to-api-tokens](public/go-to-api-tokens.png)

### 5. Create your API token and copy it

![create-api-token](public/create-api-token.png)

### 6. Rename the `.env.example` file to `.env.local`

### 7. In `.env.local`, replace the placeholders with your actual values

```
# Replace 'your-api-token' with your own API token from replicate
REPLICATE_API_TOKEN=your_api_token

# NextAuth v5 Configuration (uses AUTH_ prefix)
AUTH_SECRET=your-auth-secret-key-here
AUTH_URL=http://localhost:3000

# GitHub OAuth (Get from https://github.com/settings/developers)
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret

# Google OAuth (Get from https://console.cloud.google.com/apis/credentials)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
```

**Note:** To generate `AUTH_SECRET`, you can run: `openssl rand -base64 32`

### 8. Run the project

Back in your Terminal in the project directory, type `npm run dev`

### 9. See the running application in your browser at `localhost:3000`

![see-running-app](public/see-running-app.png)
