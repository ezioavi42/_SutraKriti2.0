export const DEFAULT_GALLERY = [
  { src: '/products/potli-bags/1785704321354-31e278e6-bag4.png', h: 360 },
  { src: 'https://images.unsplash.com/photo-1645516956968-dee62f4a9090', h: 360 },
  { src: '/products/flowers/1785536229648-3bbd6fde-img-8876.png', h: 520 },
  { src: 'https://images.pexels.com/photos/20269075/pexels-photo-20269075.jpeg', h: 380 },
  { src: 'https://images.unsplash.com/photo-1571434976902-a6e3e1eb0d51', h: 440 },
  { src: 'https://images.pexels.com/photos/32452334/pexels-photo-32452334.jpeg', h: 400 },
  { src: 'https://images.pexels.com/photos/5806996/pexels-photo-5806996.jpeg', h: 480 },
  { src: 'https://images.unsplash.com/photo-1560347964-838d2f63cdc0', h: 340 },
  { src: 'https://images.pexels.com/photos/18971489/pexels-photo-18971489.jpeg', h: 500 },
  { src: 'https://images.pexels.com/photos/36238478/pexels-photo-36238478.jpeg', h: 420 },
]

export function galleryImagesFromUrls(urls) {
  const heights = [360, 360, 520, 380, 440, 400, 480, 340, 500, 420]
  return urls.map((src, index) => ({
    src,
    h: heights[index % heights.length],
  }))
}
