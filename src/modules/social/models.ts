export interface FollowState {
  isFollowing: boolean;
  notificationsEnabled: boolean;
  followerCount: number;
  /** The viewer is this preacher (no follow button on your own page). */
  isSelf: boolean;
}

export interface FollowedPreacher {
  name: string;
  slug: string;
  photoUrl: string | null;
  isVerified: boolean;
  ministry: string;
  location: string;
  notificationsEnabled: boolean;
  isLive: boolean;
}
