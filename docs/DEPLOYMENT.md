# Deployment Guide

This guide provides detailed instructions for deploying the Realtime Voice Agent to Vercel.

## Prerequisites

- A Vercel account
- A Supabase project
- An OpenAI API key

## Vercel Setup

1.  **Create a new project on Vercel** and connect it to your GitHub repository.

2.  **Configure the environment variables** in your Vercel project settings:

    - `SUPABASE_URL`: Your Supabase project URL
    - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
    - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
    - `OPENAI_API_KEY`: Your OpenAI API key

3.  **Deploy the project.** Vercel will automatically build and deploy your project when you push to the `main` branch.

## Supabase Setup

### Database Migrations

To apply the database migrations, you can either use the Supabase CLI or run the SQL files directly in the Supabase Studio.

#### Using the Supabase CLI

1.  **Install the Supabase CLI:**

    ```bash
    npm install -g supabase
    ```

2.  **Log in to the Supabase CLI:**

    ```bash
    supabase login
    ```

3.  **Link your project:**

    ```bash
    supabase link --project-ref your-project-ref
    ```

4.  **Apply the migrations:**

    ```bash
    supabase db push
    ```

#### Using the Supabase Studio

1.  Navigate to the **SQL Editor** in your Supabase project.
2.  Open the migration files in `supabase/migrations` and copy the SQL code.
3.  Paste the SQL code into the SQL Editor and click **Run**.

### Edge Functions

To deploy the edge functions, you can use the Supabase CLI:

```bash
supabase functions deploy
```

## CI/CD

This project uses GitHub Actions to run tests and deploy to Vercel. The workflow is defined in `.github/workflows/vercel-deploy.yml`.

To enable the workflow, you will need to add the following secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel access token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID