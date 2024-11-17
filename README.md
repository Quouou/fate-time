# Fate Time Bot

![Fate Time Logo](./Fate_Time_Logo.jpg)

## Overview

Fate Time is a custom Discord bot designed to provide the server time for the Fate/Grand Order NA server.  
It supports both slash commands and text-based commands for utilities like server time and bot status.
This is also my first time creating a discord bot :D

---

## Features

- Responds to slash commands:
  - `/server-time`: Get the current Pacific Time (FGO NA Server Time).
  - `/ping`: Check if the bot is online and responsive.
- Also supports prefixed commands:
  - `!ping`: Check the bot's responsiveness.
  - `!server-time`: Get the FGO server time.
- Displays a dynamic status: `/server-time | /help`.
- Fetches tweets from official fgo page then posts on a discord channel.

---

## Commands

| Command        | Type  | Description                                |
| -------------- | ----- | ------------------------------------------ |
| `/server-time` | Slash | Get the FGO NA Server Time.                |
| `/ping`        | Slash | Check if the bot is online and responsive. |
| `/help`        | Slash | Get a list of available commands.          |
