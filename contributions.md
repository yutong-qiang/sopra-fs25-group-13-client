# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - 24.03.25 to 30.03.25

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie              | 30.03.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/5f9ebc24ed42be0bad1d8395c5acbe60c390988a                 | to make registration work, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/4, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/85, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/86, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/87      | so that the user can create an account in order to join the games |
| Katie           | 31.03.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/5ad2b2e64d125ffce1c89ca41d3acc48091d6387, https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/bc0afa529017374c2ddcbc64dcd4277ef3879ce3 | make and design the gamesession page (the correct implementation of gamesession token is still needed), https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/8, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/19, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/89  | for create and and join a gamesession which is essential to start the game  |
| Yutong             | 30.03.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/aa1abd6f4cf12d5b268787dc71a267bbc65974b1 | some basic implementation for twilio - signed up on twilio & generated account SID and Auth Token and modified some requirements according to our game setting https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/71 | for the following week to finish setting up video call when users join the game. |
| Yutong                   |  30.03.25  | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/dfb8ae1a74b399271c19e7e82894af3ce30d634e | login, logout and registration functionalities added, tests added, error handling added according to user stories and based on client side's needs. https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/20, https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/21, https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/61, https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/62  | so that users get "permission" to join the game later |
| Lorenzo            | 30.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/6d38a143c95cc1e6a5da84ad32589bb761541476 | (#29, #31, #38): Creation of GameSession and Player entities, methods for creating game session, persistence of game session and corresponding DTO returned as a response. | Game and player entities, controllers and service are necessary for implementing core functionalities. DTOs prevent information leaking.|
| Lorenzo          |30.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/663a2387c8bcc0134d47a6b5cc48bac53be8c3b9 | (#28) Added tests for successful game creation to ensure correct functioning | Fulfills the creation of endpoint for creating game session. Now functionality is working and reliable.|
| Lorenzo          | 30.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/7ebeb07254f72f6788fe9526133b67fb309729be | (#48, #50): Added endpoint for joining a game session and all necessary methods in AppService to do this. I would like this task to be counted for next week. | Implements core functionality for the application |
| Lorenzo             | 31.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/dc33339456161fc7ebbf6dd48254f4a16340821c | (#49, #149): Regulated access to game session (constraints on status, maximum number of players). I would like this task to be counted for next week.| Guarentees correct access to game session, prevents undesired behaviours from users |
| Luca               | 30.03.25   | [[Link to Commit 1]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/59de41b113ae3acf6335f2e2a341a477d176c783) | Creating the homepage and the CSS file for the correct UI design, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/91 | The homepage is the first page the user sees and the CSS file allows for consistent UI styling |
| Luca               | 31.03.25   | [[Link to Commit 2]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a5de85bf3cae8b14d0f1773ba002e5e01945da71) | Adjusted structure and style for the different pages we have so far, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/90 | To keep the UI of our application consistent with our Figma design |

---

## Contributions Week 2 - 31.03.25 to 06.04.25

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie | 05.04.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/7a0da0de9fee73d6ec25b9016c5e5fd7bb900112 | Fetches the game session token and displaye when creating a room. Can be pasted when joining a room. Redirects both after joining/creating to the game room where video call will be implemented. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/14, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/15, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/16, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/80, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/22, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/23, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/89| Player can join the same room, where the game should be played. |
| Katie         | 07.04.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/54e75715f2cc2ab31db792784668c85f3e298eda | First UI design for game page. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/92, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/29  | To determine future design, not sure yet about concept of pages for different roles. |
| Yutong | 06.04.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/f346097208472efbf063ed098e8cd1c421110719 | implemented functionalities for twilio backend, #71 | players are able to see each other during the game later |
| Yutong | 07.04.25  | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/3d3a0615756ce6f9c02fcc9eb4f0ab066f3d86ae | twilio connection frontend on locals, #71 | to be able to continue with deployment & test on different devices |
| Lorenzo | 04.04.25  | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/57688a1ffd7df077467dc2c33e1db31c62bf7950 | (#70) Implemented websockets endpoints. I would like this task to be counted for next week | Websockets endpoints are fundamental for the whole game logic for handling player actions |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| Luca | 05.04.25   | [[Link to Commit 1]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/979ee81538cda7a39336332eedbad3f3cc4b7690) | Implemented the user profile page, which displays username, profile picture and games played/won, and rules page, which shows the rules. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/73, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/74, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/76, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/77, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/78| Users can now visit their profile and the rules page and see relevant information. |
|        Luca            | 06.04.25   | [[Link to Commit 2]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/89efa6c0a9a9f0ad0d52d72ee1259215548e60dd) | Implemented the UI for the role assignment pages and the victory pages. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/35, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/39, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/61, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/62| Players will see the relevant page based on their assigned role and also see the correct victory page depending on which role wins. |

---

## Contributions Week 3 - [07.04.25] to [13.04.25]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie | 11.4.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a5332b69c6596bb328291fc3ff60bcae394b9a2b | UI design for game session including wordlist. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/94, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/68 | This is important because the game session happens on it, also the voting is following up on that. |
| Katie             | 12.04.25  | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a5332b69c6596bb328291fc3ff60bcae394b9a2b | Connecting websockets in frontend. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/96, | Entire game session will use websockets so frontend needs to connect with the backend on websockets. |
| Yutong | 11.04.25  | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/785648d0e3beca80421ac263c6f52a54daf87a42 | added code implementations based on API endpoints in M2. Adjusted tests also according to the specifications #161, #162, #164 | to have a complete function for supporting the game  |
| Yutong | 13.04.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/119103f560f9de8da54000bdaa2fa8935b2ebc00 | list of words databse & picking out a random word for normal players and nothing for chameleon, #55, #131, #132, #133  | players get a randomly chosen word and can start with the game. |
| Lorenzo | 13.04.2025   | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/bb494b95501ab0040b42438b15d9bc7b97ece10e | #168 Added handling for the "GIVE_HINT" player action. | This action is a pivotal action in the game logic, in which players give a clue about the secret word. |
|          Lorenzo          | 13.04.2025   | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/7cea13abe4f87765ab149dfe41297dfc8cc1483a| (#102, #104, #126, #84, #85, #86, #87) Implementation of actions for starting voting phase and casting the votes. I would like this contribution to be counted for next week. | The voting phase is a pivotal in the game logic.|
| Luca | 13.04.25   | [[Link to Commit 1]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/fcc6fc12753fe31cb76cdb48dea2ed8ae4cd1840) | Implemented the UI, basic functionality and a timer for the voting page. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/44, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/45, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/46, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/47, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/48, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/64, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/65, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/66,| Players will be able to vote for who they think is the chameleon and will then see the results of the voting |
|           Luca         | 13.04.25   | [[Link to Commit 2]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/7802fde86b4b26900cd959b5d0d38855ef7e64de) | Implemented the UI and basic functionality for the chameleonCaught page and worked on websocket connection. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/55, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/59, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/60, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/61, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/62, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/63, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/120,| The chameleonCaught page will be the page where the chameleon, if caught, can try to still win the game by guessing the word. A functional websocket connection will be needed to provide realtime updates for all players.|
---

## Contributions Weeks 4-5 - [14.04.25] to [27.04.25]
| **Student** | **Date** | **Link to Commit** | **Description** | **Relevance** |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie | 25.04.25 | [Commit](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/79f7ae0f295c1373c34ca39c3436728a0e3d8c85) | Role pages are on the main game session page now. After start game, players can see role page. | Everything on same `page.tsx` so Twilio stays connected. |
| Katie | 24.04.25 | [Commit 1](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/6e4a2f20c6bb35a361cfab6ddf4ac309cc1cdbe6)<br>[Commit 2](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/26c8823c1633497091aa6eccd339909f954228c0) | Tried fixing STOMP error for deployed version, but didn't succeed. | STOMP error causes the WebSocket connection to not send requests correctly. |
| Lorenzo |  |  | I used the bonus accumulated in the past weeks to avoid working on tasks and concentrate on fixing deployment issues instead. | Deployment issues related to WebSocket (modifying env to flex and other changes) are necessary to make the application work but have no direct correspondence to any task. |
|  |  |  |  |  |
| Yutong  | 21.04 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/f5697cbd7cd852206984daa6117be1e3b2170d5b, https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/8a95ea3c030d3feafe2a4d95a3295ca688cd2f49 | video working on remote between different players | to be able to continue with the next webpages |
| Yutong  | 22.04 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/89bdec9f39fc54d3482b3d923439b692b5b70166 | fixed bug of Audio also working | communication on remote complete |
| Luca | 25.04 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/7eceeae66932e56dc595637df6212df5d41c4ebe | implemented correctly retrieving the roles and the secret word, keeping video connection on voting phase, and giving hints #69, #72, #34, #40, #41, #38 | players now get assigned a role and secret word through websockets, can give hints and keep connections through phases  |
| Luca | 25.04 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/46fabd95a49d00988e4af6c1bf5e5fb936cca571 | implemented dynamically shifting between phases to change the UI depending on the phase | This removed the need for many pages, making it simpler and ensuring connections are kept |
---

## Contributions Week 5 - [28.04.25] to [04.05.25]
| **Student** | **Date** | **Link to Commit** | **Description** | **Relevance** |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie |02.05-04.05.2025  |https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/bdf7fc343ce88571b8553f8fcd2fa442176f968e https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/2831658a7c6cc7aec4ed29481e505eb72a7d8fba  | Tried to make the 8 small videos work and show the players throughout the game. But couldn't fix.  | So it looks like our UI design we submitted at the beginning. |
| Katie | 05.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/40584ec041bdcbd50ac62270c41dc4b5672f557e | Added copy button for game token. | Nice feature to have. |
| Katie | 05.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/2e3180c36c124db018bac5b7a44bf072b9496721 |Added timer display for voting phase.  | Will redirect to result page after voting. |
| Yutong | 04.05.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/084d03e6cc9f3001be9a1b4147d4ecfbfc29e54f | initial implementation for voting ends either when all players have voted or when time is up | so that voting time takes max. 30 sec |
| Yutong | 05.05.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/90cc375835ee3746a77d22dc62954c2971647aa1 | UI for mute/unmute and cam on/off | players can mute them or turn off their cameras |
| Lorenzo |01.05.2025| https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/595ac072a7d3a238acb726254e19f6ecbaeec75a|Implemented game action: handle chameleon guess #118, #119, #121, #122, #123| This is the final game action and it is relevant since it implements a key point of the game logic: when found, the chameleon should be able to guess the secret word|
| Lorenzo |01.05.2025| https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/3244a06c818dbee654ceac345f612af92bdedb03|  Added authentication token check for game creation closes #30|Only authenticated users should be able to create a game session|
| Lorenzo |01.05.2025| https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/c334a9a06b9eb26536fbf7caf91a1415d66fa96e|Handle exception thrown by TwilioService during game creation| Handling of this exceptions allows to better understand what is failing and where when creating a game session|
| Luca | 04.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/dc7d06d9f0fdc5a0e6177f677b9abd71657797a4 | potential fix for remote videos, detaching before phase switch, now also including voting phase | videos should also work now so players can always see eachother, no matter the phase |
| Luca | 01.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/436502c8c8809f939a066d46645bf7c45758ddac | made the voting button only visible once all players have given a clue, role assignment works, secret word is only displayed to the correct players, also trying to fix center screen #82, #36, #42 | fixed bugs and added needed features |
_Continue with the same table format as above._

---

## Contributions Week 6 - [05.05.25] to [11.05.25]
| **Student** | **Date** | **Link to Commit** | **Description** | **Relevance** |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie | 08.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/0be5452bb197d6f1dbf6a7f115f57fabb2d295d4 https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/7668c66d58175bcd5347de4dc41ec006ebc7f658| Fixed the lobby to display all 8 players. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/25 | Now everyone can see all players video screen in the lobby. |
| Katie | 10.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/0a8e9c1fd57868dadb9208ce93441d3e7e7d6707   | Implement the word list also on voting page. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/70 | Better UI design. |
| Katie | 10.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a6d287a34f86ba5df039c80a901e67dda7f10eae | Display a message when player tries to enter more than one word as a hint. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/99  | Better UI design. |
| Yutong | 11.05.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a81783622b5df29daad9329c9f944b1dce0feb82 | when players click on return / go back to "/main" page, reload the page so that the webcamera is turned off. | correctly handle the webcamera for privacy. |
| Yutong | 11.05.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/5c7637c9729e9c59d51d83e3a349c921f34cc968 | while testing with other friends with the game, some advices were given and "enter" button for send was implemented; more interactive UI for mic and camera are implemented | make it easier for users to play the game and understand what usability the game can serve. |
| Lorenzo |  06.05.25|  https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/9cbaa6495b7e2673b2ced4ad2c28d3a8a60d0f9b|  Fixes #125 (voting countdown)|  Countdown for voting phase is a key feature specified inuser stories. Previous code that created issues with handling the voting phase has been fixed.|
| Lorenzo |  11.05.25|  https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/f8c9128ac2dd7e1bac04a63a0021dadf797321bb| Closes #140, #144 |  Implemented endpoint for changing avatar (feature required by user stories).|
| Luca | 08.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/b47941580a910d838fbc7f30c507170955a0f700 | implemented being able to guess the secret word when caught #56, #57, #59, #60, #61, #62, #63 | the chameleon can now win the game by guessing the secret word correctly |
| Luca | 07.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a307ce68acc913ae936eb124b5bef25564c640a1 | Changed display when all turns are over and added victory pages after voting #50, #56, #57 | after voting the correct outcome happens based on who was voted for |
| Luca | 11.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/de82b95a4bd86c6c4d1297d3033cfd05f036a9e8 | added different victory screens based on victory condition and updated UI for victory and ready to vote | at victory the correct messages and UI elements are displayed to the players based on their roles |

---

## Contributions Week 7 - [12.05.25] to [18.05.25]
| **Student** | **Date** | **Link to Commit** | **Description** | **Relevance** |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie |18.05.2025  |https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/f5c38b1443bcb0d75fb316c2e517773e5ce1ff40 | Players can play new round after a round has added. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/102 | Easier to play a new round than before. |
| Katie | 14.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/63f432912d2a91908c0e522dc8db51f68a1118ab https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/546c4bf606634789cfec5c5a271edbba5dc81500 https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/896f2e1fce34f7d4b7726b3b08de65f333fe82ef | Wordlist display names when giving a hint. https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/103 | Better UI. |
| Yutong | 04.05.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/084d03e6cc9f3001be9a1b4147d4ecfbfc29e54f | initial implementation for voting ends either when all players have voted or when time is up | so that voting time takes max. 30 sec |
| Yutong | 05.05.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/90cc375835ee3746a77d22dc62954c2971647aa1 | UI for mute/unmute and cam on/off | players can mute them or turn off their cameras |
| Lorenzo |01.05.2025| https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/595ac072a7d3a238acb726254e19f6ecbaeec75a|Implemented game action: handle chameleon guess #118, #119, #121, #122, #123| This is the final game action and it is relevant since it implements a key point of the game logic: when found, the chameleon should be able to guess the secret word|
| Lorenzo |01.05.2025| https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/3244a06c818dbee654ceac345f612af92bdedb03|  Added authentication token check for game creation closes #30|Only authenticated users should be able to create a game session|
| Lorenzo |01.05.2025| https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/c334a9a06b9eb26536fbf7caf91a1415d66fa96e|Handle exception thrown by TwilioService during game creation| Handling of this exceptions allows to better understand what is failing and where when creating a game session|
| Luca | 17.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/39bd8813d9b48cef0c46920e91fd39386966e588 | added leaderboard page, moved rules button [#101](https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/101) | leaderboard for persistance, rules button makes more sense on main menu |
| Luca | 18.05.2025 | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/883e7007857f81056d136d5505138654fc31f3d3 | added profile pic customization and also display avatar on leaderboard [#75](https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/75) | users can now upload avatar, which will be displayed on profile and leaderboard |
_Continue with the same table format as above._

---

_Continue with the same table format as above._
