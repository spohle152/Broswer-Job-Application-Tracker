# Job Application Tracker

A lightweight desktop app for organizing job applications, follow-ups, interviews, offers, denials, and job-specific notes. It runs locally with Python and [pywebview](https://pywebview.flowrl.com/), so your application data stays on your computer.

## Features

- Automatically groups applications into **Needs Followup**, **No Action**, **Offers**, and **Denials**.
- Uses a configurable follow-up window, remembered between sessions.
- Visually distinguishes applications that have reached the interview stage.
- Adds, edits, and deletes applications from the **Manage Applications** page.
- Tracks company, job title, location, status, last update, and previous follow-up activity.
- Creates and edits a Markdown file for each application's job description or notes.
- Opens Markdown notes in your computer's default editor.
- Preserves compatibility with data created by the original browser-only tracker.

## Requirements

- Python 3.9 or newer
- A supported system webview (included with current macOS and Windows installations; Linux may require GTK or Qt webview packages)

## Installation

1. Clone the repository and enter its directory:

   ```bash
   git clone https://github.com/spohle152/Broswer-Job-Application-Tracker.git
   cd Broswer-Job-Application-Tracker
   ```

2. Create a virtual environment:

   ```bash
   python3 -m venv .venv
   ```

3. Activate it.

   macOS or Linux:

   ```bash
   source .venv/bin/activate
   ```

   Windows PowerShell:

   ```powershell
   .venv\Scripts\Activate.ps1
   ```

4. Install the dependency:

   ```bash
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```

## Running the App

With the virtual environment activated, run:

```bash
python app.py
```

The tracker opens in its own desktop window. Keep the terminal open while using it. To stop the app, close its window or press `Ctrl+C` in the terminal.

## Using the Tracker

The **Dashboard** sorts applications by their current status and the number of days since they were updated. Change **Days Before Followup** to control when an active application moves into the follow-up column.

Open **Manage Applications** to add an application or select an existing one. Choose one of these statuses:

- **Active** — remains in No Action until the follow-up threshold is reached.
- **Interviewed** — follows the same timing rules but receives interview-specific coloring.
- **Offered** — appears in Offers.
- **Denied** — appears in Denials.

Selecting a card on the Dashboard opens that application in the editor. Saving updates both the Dashboard and the local data files.

## Job Descriptions and Notes

Each application can have a Markdown note stored in `Job Application Markdowns/`. Enter a **Description File** name or leave it blank to generate one from the company and job title.

For example, the value `example-role` maps to:

```text
Job Application Markdowns/example-role.md
```

Write notes directly in the app, or use **Open Markdown** to edit the file with your computer's default Markdown/text editor.

## Data Storage

Application records are stored in `data.json`. The app continues to use the original JavaScript-compatible `data = '...'` format so existing tracker data remains usable.

Each record contains:

- `Company`
- `JobTitle`
- `Location`
- `Denied`
- `Interviewed`
- `Offered`
- `DateUpdated`
- `PreviousFollowup`
- `DescriptionFile`

Back up `data.json` and `Job Application Markdowns/` if you want a separate copy of your tracker data. Deleting an application removes its record but does not delete its Markdown file.

## Browser-Only Preview

You can open `index.html` directly in a browser to view the data currently stored in `data.json`. This mode is read-only; saving, deleting, and opening Markdown files require launching the desktop app with `python app.py`.
