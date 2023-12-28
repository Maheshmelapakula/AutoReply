# AutoReply



Gmail Auto-Reply Application

This application is designed to automatically reply to unread emails in your Gmail inbox with a predefined message. It utilizes the Google Gmail API to access and manage emails.

Setup

Prerequisites
Node.js: Ensure you have Node.js installed on your machine.
Google Cloud Project Setup:
Create a project on Google Cloud Console.
Enable the Gmail API for the project.
Download the JSON credentials file from Google Cloud Console.

Installation
Clone this repository.

git clone https://github.com/your-username/your-repo.git
Install dependencies.


npm install
Place your Google Cloud credentials file (e.g., credentials.json) in the root directory of the project.

Usage
Run the application.


npm start
Access the application at http://localhost:1040 in your web browser.

The application will authenticate using your credentials, fetch unread emails from your Gmail inbox, and send an auto-reply to those messages if they haven't been replied to already.
