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

## Contributions Week 1 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| Katie              | 30.03.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/5f9ebc24ed42be0bad1d8395c5acbe60c390988a                 | to make registration work, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/4, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/85, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/86, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/87      | so that the user can create an account in order to join the games |
| Katie           | 31.03.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/5ad2b2e64d125ffce1c89ca41d3acc48091d6387, https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/bc0afa529017374c2ddcbc64dcd4277ef3879ce3 | make and design the gamesession page (the correct implementation of gamesession token is still needed), https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/8, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/19, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/89  | for create and and join a gamesession which is essential to start the game  |
| Yutong             | 30.03.25   | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/aa1abd6f4cf12d5b268787dc71a267bbc65974b1 | some basic implementation for twilio - signed up on twilio & generated account SID and Auth Token and modified some requirements according to our game setting https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/71 | for the following week to finish setting up video call when users join the game. |
| Yutong                   |  30.03.25  | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/dfb8ae1a74b399271c19e7e82894af3ce30d634e | login, logout and registration functionalities added, tests added, error handling added according to user stories and based on client side's needs. https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/20, https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/21, https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/61, https://github.com/yutong-qiang/sopra-fs25-group-13-server/issues/62  | so that users get "permission" to join the game later |
| Lorenzo            | 30.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/6d38a143c95cc1e6a5da84ad32589bb761541476 | Creation of GameSession and Player entities, methods for creating game session, persistence of game session and corresponding DTO returned as a response. | Game and player entities, controllers and service are necessary for implementing core functionalities. DTOs prevent information leaking.|
| Lorenzo          |30.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/663a2387c8bcc0134d47a6b5cc48bac53be8c3b9 | Added tests for successful game creation to ensure correct functioning | Fulfills the creation of endpoint for creating game session. Now functionality is working and reliable.|
| Lorenzo          | 30.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/7ebeb07254f72f6788fe9526133b67fb309729be | Added endpoint for joining a game session and all necessary methods in AppService to do this. I would like this task to be counted for next week. | Implements core functionality for the application |
| Lorenzo             | 31.03.25 | https://github.com/yutong-qiang/sopra-fs25-group-13-server/commit/dc33339456161fc7ebbf6dd48254f4a16340821c | Regulated access to game session (constraints on status, maximum number of players). I would like this task to be counted for next week.| Guarentees correct access to game session, prevents undesired behaviours from users |
| Luca               | 30.03.25   | [[Link to Commit 1]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/59de41b113ae3acf6335f2e2a341a477d176c783) | Creating the homepage and the CSS file for the correct UI design, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/91 | The homepage is the first page the user sees and the CSS file allows for consistent UI styling |
| Luca               | 31.03.25   | [[Link to Commit 2]](https://github.com/yutong-qiang/sopra-fs25-group-13-client/commit/a5de85bf3cae8b14d0f1773ba002e5e01945da71) | Adjusted structure and style for the different pages we have so far, https://github.com/yutong-qiang/sopra-fs25-group-13-client/issues/90 | To keep the UI of our application consistent with our Figma design |

---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@githubUser1]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser2]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
