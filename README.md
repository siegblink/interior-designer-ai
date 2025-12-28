# Interior Designer AI

![interior-design-image](public/app-screenshot.png)

A modern, AI-powered application for transforming interior spaces with cutting-edge design. Upload a photo of your room and get a redesigned space in seconds.

## Features

- **Modern UI** with glassmorphism effects and fluid animations
- **AI-Powered Design** transformation using Replicate API
- **Multiple Design Styles** including Modern, Vintage, Minimalist, and Professional
- **Various Room Types** such as Living Room, Dining Room, Bedroom, Bathroom, and Office
- **Responsive Design** that works on both desktop and mobile devices

## How to use

### 1. Clone this project's repository

In your Terminal app

- Type `git clone git@github.com:azizbekdevuz/interior-designer-ai.git`
- Or type `git clone https://github.com:yourname/interior-designer-ai.git` if you've forked the repo

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

### 7. In `.env.local`, replace the placeholder _your_api_token_ with your API token

```
# Replace 'your-api-token' with your own API token from replicate
REPLICATE_API_TOKEN=your-api-token
```

### 8. Run the project

Back in your Terminal in the project directory, type `npm run dev`

### 9. See the running application in your browser at `localhost:3000`

![see-running-app](public/see-running-app.png)

## Technologies Used

- **Next.js** - React framework for production
- **React** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for React
- **Headless UI** - Unstyled, accessible UI components
- **Replicate API** - For AI-powered design transformations

## Contributing

Contributions are welcome! Please check out our [contribution guidelines](CONTRIBUTING.md) first.

## License

This project is open source and available under the [MIT License](LICENSE).
