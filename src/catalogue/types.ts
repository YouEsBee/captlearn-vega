/** One video in the catalogue. Its file, thumbnail and captions are found on the backend by `id`. */
export interface Video {
  id: string;
  title: string;
  lengthSeconds: number;
  /** HSK level of the video's language, 1 = easiest. Decides its home screen row. */
  level: number;
  /** Who to credit for the video, shown on its card. */
  credit: string;
}

/** One home screen row: the videos at one HSK level, in suggested order. */
export interface CatalogueRow {
  level: number;
  videos: Video[];
}
