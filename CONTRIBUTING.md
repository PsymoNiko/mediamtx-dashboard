# 🤝 Contribution Guidelines

We welcome and appreciate all contributions\! By participating in this project, you help us improve the MediaMTX dashboard for everyone.

Please take a moment to review this document to make the contribution process as clear and efficient as possible.

## Code of Conduct

Please note that this project is governed by a **Code of Conduct**. By participating, you are expected to uphold this code. Please report unacceptable behavior to the repository owner.

-----

## ⚙️ Getting Started (Setting up Your Environment)

The `mediamtx-dashboard` relies on **Next.js**, **TypeScript**, and **pnpm** for development, and **Docker** for containerized testing.

### Prerequisites

1.  **Git**
2.  **Node.js** (LTS version)
3.  **pnpm** (`npm install -g pnpm`)
4.  **Docker** & **Docker Compose**

### Installation

1.  **Fork** the repository to your own GitHub account.
2.  **Clone** your forked repository:
    ```bash
    git clone https://github.com/YourUsername/mediamtx-dashboard.git
    cd mediamtx-dashboard
    ```
3.  **Install dependencies** using pnpm workspaces:
    ```bash
    pnpm install
    ```
4.  **Start the local development environment** (including a MediaMTX instance) using the provided development Docker Compose file:
    ```bash
    docker-compose -f docker-compose.dev.yml up -d
    ```
5.  **Run the Next.js development server:**
    ```bash
    pnpm dev
    ```
    The dashboard will now be running on `http://localhost:3000` and connected to the MediaMTX API.

-----

## 💡 Submitting Contributions (Pull Requests)

### 1\. Create a Branch

Create a descriptive branch for your changes. Use a prefix to categorize your work:

  * `feat/your-new-feature`
  * `fix/bug-description`
  * `refactor/code-cleanup`
  * `docs/update-readme`

<!-- end list -->

```bash
git checkout -b feat/my-awesome-feature
```

### 2\. Commit Your Changes

  * Make sure your changes are committed with clear, atomic, and descriptive commit messages.
  * We follow the **Conventional Commits** specification (e.g., `feat(ui): add dark mode toggle`).

### 3\. Open a Pull Request (PR)

  * Push your branch to your forked repository.
  * Open a new Pull Request on the main repository, targeting the **`main`** branch.
  * **Provide a clear title and description.** Explain *what* your PR does and *why* it is necessary. If it addresses an open issue, please link to it (e.g., `Fixes #123`).

-----

## ✏️ Style Guide & Standards

### Technology Stack

  * **Code:** Write all new features and fixes in **TypeScript** (`.ts`/`.tsx`). Avoid adding plain JavaScript files unless absolutely necessary.
  * **Styling:** Follow the existing **Tailwind CSS** and modular CSS conventions.
  * **Framework:** Adhere to **Next.js** best practices (e.g., proper use of `app` directory, API routes, and components).

### Linting and Formatting

The project includes pre-configured tools for code consistency. Before submitting a PR, ensure your code passes all checks:

1.  Run the linter to catch errors:
    ```bash
    pnpm lint
    ```
2.  Format your code using Prettier:
    ```bash
    pnpm format
    ```

-----

## 🐛 Bug Reports & Feature Requests

### 🐞 Reporting Bugs

If you find a bug, please check the [Issues](https://github.com/PsymoNiko/mediamtx-dashboard/issues) page to see if it has already been reported. If not, open a new issue with the following information:

  * A **clear and descriptive title**.
  * The **steps to reproduce** the issue.
  * The **expected behavior** and the **actual behavior**.
  * Your environment details (OS, browser, etc.).

### ✨ Suggesting Features

We welcome ideas for new features\! Please open a new issue and use a tag like **[Feature Request]** in the title. Describe your idea and the problem it solves.
