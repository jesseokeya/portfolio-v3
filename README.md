# Portfolio

Welcome to my portfolio website, [jesseokeya.com](https://jesseokeya.com) — a space where I showcase my work, ideas, blog posts, and various side projects. Built with Next.js, this app lives under `apps/web` and is deployed using [SST](https://sst.dev), leveraging AWS for serverless infrastructure and Cloudflare for domain management.

## Features

- **Portfolio**: A comprehensive showcase of my professional work, projects, and accomplishments.
- **Blog**: Posts where I share my thoughts on software engineering, product development, and more.
- **Playground**: A place for my experimental ideas, side projects, and creative coding.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Infrastructure**: [SST](https://sst.dev) for deploying to AWS serverless environment.
- **Domain Management**: [Cloudflare](https://cloudflare.com)
- **Backend Services**: AWS Lambda, DynamoDB, and API Gateway for serverless computing.

## Development

This project is structured as a mono repo and the portfolio app is located under `apps/web`. If you'd like to explore or contribute, here's how to get started:

### Installation

```bash
git clone https://github.com/jesseokeya/portfolio-v3.git
pnpm install
```

## Running Locally
To start the development server:
```bash
pnpm web:dev
```
Visit http://localhost:3000 to view the app locally.

## Deploying
The app is deployed using SST with the following commands:
```bash
pnpm sst:unlock:prod && pnpm sst:deploy:prod
```
SST will handle deploying the Next.js app to AWS, leveraging serverless functions

```mermaid
graph LR;
    A[User] --> B[jesseokeya.com];
    B --> C[Cloudflare DNS];
    C --> D[CloudFront - AWS CDN];
    D --> E[S3 Bucket - Static Assets];
    D --> F[Lambda@Edge - Server-Side Rendering];
    F --> G(Next.js App Deployed via SST);

    subgraph AWS Infrastructure
        E --> G
        F --> G
    end
```

## Contact

Feel free to reach out if you have any questions or ideas you'd like to discuss!

- **Website**: [jesseokeya.com](https://jesseokeya.com/)
- **Email**: jesseokeya@gmail.com.

