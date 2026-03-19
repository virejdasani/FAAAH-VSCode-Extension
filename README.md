# FAAAAAH - Error Sound Alert

A VS Code extension that plays a sound when your code has errors.

![Marketplace](https://img.shields.io/visual-studio-marketplace/v/VirejDasani.faaaaah?label=VS%20Code%20Marketplace)

## Features

- Plays a sound effect whenever new errors appear in your code
- Optional warning sounds
- Sidebar settings panel to configure everything without touching `settings.json`

## Settings

Open the **FAAAAAH** panel in the activity bar (left sidebar) to configure:

| Setting | Description | Default |
|---|---|---|
| Trigger after this many new errors | How many new errors must appear before the sound plays | `1` |
| Custom error sound path | Absolute path to your own `.mp3` or `.wav` file | bundled sound |
| Enable warning sound | Also play a sound when warnings increase | `false` |
| Trigger after this many new warnings | How many new warnings must appear before the sound plays | `1` |
| Custom warning sound path | Absolute path to your own warning sound file | bundled sound |

## Installation

Search for **FAAAAAH** in the VS Code Extensions panel, or install it directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=VirejDasani.faaaaah&ssr=false#overview).

## Custom Sounds

You can use your own sound file by entering its absolute path in the sidebar. Supports `.mp3` and `.wav`.

## Platform Support

| Platform | Playback method |
|---|---|
| macOS | `afplay` |
| Windows | PowerShell `Media.SoundPlayer` |
| Linux | `aplay` / `paplay` |
