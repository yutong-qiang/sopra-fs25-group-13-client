export interface User {
  id: string | null;
  name: string | null;
  username: string | null;
  token: string | null;
  status: string | null;
  wins: number;
  roundsPlayed: number;
  avatar?: string;
}
