# THE CHAMELEON

## Introduction
The Chameleon is a web-based multiplayer social deduction game inspired by the popular party game of the same name. In each round, all players except one — the Chameleon — are shown a secret word. Players then take turns giving subtle clues related to the word, trying to show they know it without being too obvious. The Chameleon, who doesn't know the word, must improvise a clue and blend in. After all clues are given, everyone votes to find the imposter.
Our implementation is designed for seamless online play, featuring real-time interactions so players can see each other’s reactions and experience synchronized role assignment, hint and voting phases, and results. Unlike traditional versions, our app does not use a grid of words and instead only one secret word is selected per round to keep the game simple while maintaining a fun and engaging experience. We've also added other features like automatic round tracking and the leaderboard. The game is ideal for remote groups looking for face-to-face social deduction gameplay from anywhere.


## Technologies used
* **Frontend**: Next.js, React
* **Backend**: Java, Spring Boot, STOMP WebSocket (via SockJS)
* **Video API**: Twilio Video API
* **Deployment**: Google App Engine, Vercel


## High-level components
### [app\game\join\[gameToken]\page.tsx](https://github.com/yutong-qiang/sopra-fs25-group-13-client/blob/main/app/game/join/%5BgameToken%5D/page.tsx)
* Controls the full game experience: joining a session, displaying video streams using Twilio, handling all game phases (lobby, role reveal, hinting, voting, results), and updating the UI in real time via WebSocket messages.
* Dynamically renders video tiles for up to 8 players, manages timers for voting, and adjusts the layout based on game state.
* Provides role-specific interfaces (Chameleon vs. Player), input validation for clues and guesses, and clean transitions between rounds.

### [app\leaderboard\page.tsx](https://github.com/yutong-qiang/sopra-fs25-group-13-client/blob/main/app/leaderboard/page.tsx)
* Displays a leaderboard showing all registered users with their total wins, win rates, and number of rounds played.
* Sorts users by win rate and renders the list in a styled table layout.
* Provides users with an overview of the top performers and their own performance for motivation and engagement.

### [app\customizeProfile\page.tsx](https://github.com/yutong-qiang/sopra-fs25-group-13-client/blob/main/app/customizeProfile/page.tsx)
* Allows users to view their profile information, including their viewing their display name and changing their avatar image.
* Offers real-time visual feedback on changes and validates input.

## Launch & Deployment
### Prerequisites
Before starting, make sure you have:
* Java 17+
* Gradle
* Node.js (for frontend)
* External Dependency: Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY, TWILIO_API_SECRET)
* Google Cloud SDK (for deployment)

### Setup
```
git clone https://github.com/yutong-qiang/sopra-fs25-group-13-client.git
```
```
cd sopra-fs25-group-13-client
```

### Build the application
```
npm run build
```

### Run the application
```
npm run dev
```

### Deployment
* The main branch is automatically deployed onto Vercel


## Illustrations
### Login or Register
![image](https://github.com/user-attachments/assets/33b87dc1-6213-4faf-93c0-adeb26018028)
![image](https://github.com/user-attachments/assets/ff62cc2c-cb77-4f76-b523-b0da086e44dc)

### Game Lobby
![WhatsApp Image 2025-05-22 at 23 01 25_b192c01c](https://github.com/user-attachments/assets/5a6276fd-87e7-482a-8898-decb8860c5e1)

### After all players have given the hint
![image](https://github.com/user-attachments/assets/2d13fb6a-ce1b-4af1-a67b-5dd9cec05ad2)

### During the voting phase
![image](https://github.com/user-attachments/assets/1d2440df-7af0-43a2-93fa-f99167c6ef6d)

### Result Pages: 
Chameleon gets caught
![WhatsApp Image 2025-05-22 at 23 23 57_d4f1317e](https://github.com/user-attachments/assets/f6c440ac-4a7f-4ea7-b694-5b0c1d559db3)
![WhatsApp Image 2025-05-22 at 23 24 02_1aa0007f](https://github.com/user-attachments/assets/bc4f7f5f-c79c-49d3-ba6a-314b586d9fd3)
![WhatsApp Image 2025-05-22 at 23 24 50_3c9b9c76](https://github.com/user-attachments/assets/b84a0056-fe2b-433f-95da-1b089fb390c4)

Chameleon escapes
![WhatsApp Image 2025-05-22 at 23 26 46_4ea20ffa](https://github.com/user-attachments/assets/bc259500-fba3-4c0b-87aa-f67a4a2c0e8f)
![WhatsApp Image 2025-05-22 at 23 27 07_a684da03](https://github.com/user-attachments/assets/d51a91a3-678b-4e75-af49-c7ef688116a2)


Chameleon guesses the correct word
![WhatsApp Image 2025-05-22 at 23 27 18_61931e70](https://github.com/user-attachments/assets/91fc1c41-1ac2-4e81-b8f2-8d7106334183)


Chameleon guesses the wrong word
![WhatsApp Image 2025-05-22 at 23 24 44_24ec4fed](https://github.com/user-attachments/assets/fad2c186-69ab-4118-91cc-f1300794ce9a)


### Start a new round:
![WhatsApp Image 2025-05-22 at 23 27 00_e0c6138c](https://github.com/user-attachments/assets/fae79603-c218-4a63-838d-230fea6c3e2f)


## Roadmap
* Spectator Mode for non-players to watch ongoing games
* AI-powered hint suggestions for solo / async play
* Mobile layout optimization for better touch UX

## Authors and Acknowledgement
* Katie Jingxuan He - [cutie72](https://github.com/cutie72)
* Lorenzo Frigoli - [lorefrigo](https://github.com/lorefrigo)
* Luca Bärtschiger - [lucabarts](https://github.com/lucabarts)
* Yutong Qiang - [yutong-qiang](https://github.com/yutong-qiang)

Special thanks to our teaching assistant Lukas Niedhart for his guidance, support, and valuable feedback throughout the development process. 

We also appreciate the course Software Engineering Lab for providing a hands-on learning experience.

Thanks to everyone who helped us test the software and provided valuable suggestions.

## License
This project is licensed under the Apache License 2.0 – see the [LICENSE](https://github.com/yutong-qiang/sopra-fs25-group-13-server/blob/main/LICENSE) file for details.
