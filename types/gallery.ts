export interface PhotoItem {
  id: number;
  url: string;
  title: string;
  description: string;
  uploadedAt: string;
  views: number;
  likes: number;
  comments: number;
}

export interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  photos: PhotoItem[];
  coverPhoto?: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface GalleryProps {
  galleries: GalleryItem[];
  isOwner: boolean;
  onAddPhoto?: (galleryId: number) => void;
  onCreateGallery?: () => void;
}

export interface UpdateGalleriesProps {
  galleries: GalleryItem[];
  userId: string;
  onUpdateGallery?: (gallery: GalleryItem) => void;
  onCreateGallery?: (gallery: Partial<GalleryItem>) => void;
  onDeleteGallery?: (galleryId: number) => void;
  onAddPhotoToGallery?: (galleryId: number, photos: File[]) => void;
}
