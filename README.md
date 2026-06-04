# Underdelivery

Welcome to the **Underdelivery** project! This is a modern, full-stack web application built with a robust set of technologies designed for performance, scalability, and secure transactions.

## 🚀 Tech Stack Overview

This project leverages the following core technologies:

### 1. Frontend & Core Framework: Next.js & React
* **Next.js (v16.x)**: We utilize Next.js as our foundational framework. It provides us with server-side rendering (SSR), static site generation (SSG), and the modern App Router (`src/app`) for optimal performance and SEO.
* **React (v19.x)**: The UI is built using React components, taking advantage of the latest features and concurrent rendering capabilities. 

### 2. Backend & Database: Firebase
* **Firebase SDK (v12.x)**: Used on the client side for authentication, real-time database updates, and communicating with Firebase services.
* **Firebase Admin (v12.x)**: Ensures secure, server-side interactions with Firebase. This is crucial for verifying tokens, managing user accounts securely, and bypassing client-side security rules when necessary (e.g., in Next.js API routes or Server Actions).
* **Cloud Firestore**: We use Firestore as our primary NoSQL database, as indicated by the `firestore.rules` and `firestore.indexes.json` files, ensuring scalable and flexible data storage.

### 3. Payments Processing: Razorpay
* **Razorpay (v2.9.x)**: Integrated for secure and seamless payment processing. This handles transactions, subscriptions, or any financial operations required by the platform.

### 4. Security & Utilities
* **crypto-js**: A library of crypto standards used for encrypting and decrypting sensitive data, hashing, or verifying signatures (often useful when handling payment webhooks or sensitive payloads).

## 📁 Project Structure

The project follows a clean architecture within the `src/` directory:
* `/src/app/` - Contains the Next.js App Router pages, layouts, and API routes.
* `/src/components/` - Reusable UI components.
* `/src/hooks/` - Custom React hooks for encapsulating stateful logic.
* `/src/lib/` - Utility functions, Firebase configuration, and third-party integrations (like Razorpay).
* `/src/styles/` - Global styles and CSS configurations.

## 🛠️ Getting Started

First, ensure you have your environment variables set up in a `.env.local` file (including your Firebase and Razorpay credentials).

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## 🚀 Deployment

This Next.js app is optimized for deployment on [Vercel](https://vercel.com/), providing zero-configuration deployments, global edge networks, and seamless CI/CD. Make sure to configure your Firebase and Razorpay environment variables in the Vercel dashboard before deploying.
