// lib/games.ts
export interface GameInfo {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
}

export const GAMES: GameInfo[] = [
  {
    slug: 'minesweaper',
    title: '지뢰찾기',
    description: '터지지 않고 모든 지뢰의 위치를 밝혀내세요.',
    thumbnail: '/thumbnails/minesweaper.png',
  },
];
