# Taxi Receipt Tracker - Expo App

This is a vibe-coded React Native Expo application for taxi drivers to track their earnings by capturing and logging receipts with metadata. Currently, Supabase Third Party Auth with Google Identity is available for users to register and login securely. Receipts are captured via phone camera and stored in Cloudinary with references to metadata along with other metadata such as amount, date and time which are entered by the user, and stored in Supabase. Disclaimer 1: Only database structure and general UI workflows were planned for myself. The building of the app UI and the stylistic design was done with Impeccable in Gemini CLI (credits: https://github.com/pbakaus/impeccable). Disclaimer 2: This app has only been tested in the latest iPhone device.

## Getting Started

Follow these steps to get your development environment set up and the app running.

### 1. Prerequisites

-   Supabase Account
-   Cloudinary Account
-   Google Cloud Project for Google OAuth

### 2. Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/taxi-expo-app.git
    cd taxi-expo-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Configure Environment Variables**:
    ```bash
    cp .env.template .env
    ```
    Open `.env` and fill in the following:
    ```
    EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    EXPO_PUBLIC_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
    EXPO_PUBLIC_UPLOAD_PRESET=YOUR_CLOUDINARY_UPLOAD_PRESET
    ```

### 3. Supabase Setup

#### a. Project Creation & API Keys

1.  Go to your Supabase Dashboard and create a new project.
2.  Navigate to `Project Settings > API` to find your `Project URL` and `Anon Key`. Update these in your `.env` file.

#### b. Google Authentication (Note, this is only to run it locally)

1.  **Enable Google Provider**:
    -   In your Supabase project, go to `Authentication > Providers`.
    -   Enable `Google`.
    -   You'll need a `Google Client ID` and `Google Client Secret`.
2.  **Google Cloud Project Configuration**:
    -   Go to Google Cloud Console and select/create your project.
    -   Navigate to `APIs & Services > OAuth consent screen`.
        -   Configure your consent screen (User type: External, publish status: Testing or In Production).
    -   Navigate to `APIs & Services > Credentials`.
        -   Click `+ CREATE CREDENTIALS` and select `OAuth client ID`.
        -   **Application type**: Select `Web application`.
        -   **Authorized JavaScript origins**: Add your Supabase project URL (e.g., `https://your-project-ref.supabase.co`).
        -   **Authorized redirect URIs**: Add your Supabase callback URL (e.g., `https://your-project-ref.supabase.co/auth/v1/callback`).
        -   **Note the Client ID and Client Secret**. Paste these into the Supabase Google Provider settings.
3.  **Expo Redirect URI**:
    -   When you run the app, check your terminal for the `--- SUPABASE CONFIGURATION ---` log. It will provide a `redirectTo` URL like `https://auth.expo.io/@your-username/your-app-slug` and a `Site URL` that you need to add to your Supabase project's `Authentication > URL Configuration`. This is crucial for Expo Go.

#### c. Database Schema (SQL)

Apply the following SQL to your Supabase project via the SQL Editor:

```sql
-- Create a public profiles table to track registered users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle the synchronization of user data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create the receipts table
CREATE TABLE public.receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  notes TEXT,
  image_url TEXT NOT NULL,
  public_id TEXT NOT NULL, -- Cloudinary public_id for deletion
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on receipts table
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own receipts
CREATE POLICY "Users can view their own receipts"
ON public.receipts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own receipts
CREATE POLICY "Users can insert their own receipts"
ON public.receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own receipts
CREATE POLICY "Users can delete their own receipts"
ON public.receipts FOR DELETE
USING (auth.uid() = user_id);
```

#### d. Supabase Edge Function (for Cloudinary Deletion)

The app utilizes a Supabase Edge Function to securely delete images from Cloudinary.

1.  **Install Supabase CLI**
2.  **Link Project**:
    ```bash
    supabase login
    supabase link --project-ref your-project-ref # Replace 'your-project-ref' with your Supabase Project ID
    ```
3.  **Deploy Edge Function**:
    Navigate to the `supabase/functions/delete-cloudinary-image` directory.
    ```bash
    cd supabase/functions/delete-cloudinary-image
    supabase functions deploy delete-cloudinary-image --no-verify-jwt --no-module-check
    ```
4.  **Set Supabase Secrets**: These are vital for the Edge Function to authenticate with Cloudinary.
    ```bash
    supabase secrets set CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
    supabase secrets set CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
    supabase secrets set CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
    ```

### 4. Cloudinary Setup

1.  **Create a Cloudinary Account**.
2.  **API Credentials**: From your Cloudinary Dashboard, find your `Cloud Name`, `API Key`, and `API Secret`.
3.  **Upload Preset**:
    -   Go to `Settings > Upload > Upload presets`.
    -   Click `Add upload preset`.
    -   Set `Mode` to `Unsigned`.
    -   Note the `Upload preset name`.
4.  **Update `.env` and Supabase Secrets**: Use these values in your `.env` file and set them as Supabase secrets as described above.

## Running the App

1.  **Start the Expo Development Server**:
    ```bash
    npx expo start
    ```
2.  **Open in Expo Go**:
    Scan the QR code displayed in your terminal with the Expo Go app on your phone.

## Planned Features
1. Allow users to update any of their current receipts in case there were errors in entry
2. Update database to include users metadata to also be included such as name
3. Integrate OCR capabilities to autofill totals, dates, and times
