export const GALLERY = [
  { src: '/images/bird.jpg', title: 'Панорама жилого комплекса', tag: 'Общий вид' },
  { src: '/images/cam1.jpg', title: 'Жилой комплекс — вид 1', tag: 'Жилое' },
  { src: '/images/cam2.jpg', title: 'Жилой комплекс — вид 2', tag: 'Жилое' },
  { src: '/images/cam3.jpg', title: 'Архитектурный комплекс', tag: 'Жилое' },
  { src: '/images/cam4.jpg', title: 'Благоустройство двора', tag: 'Благоустройство' },
  { src: '/images/cam5.jpg', title: 'Озеленение территории', tag: 'Благоустройство' },
  { src: '/images/cam6.jpg', title: 'Детские и спортивные площадки', tag: 'Общественное' },
  { src: '/images/cam7.jpg', title: 'Современные жилые комплексы', tag: 'Жилое' },
  { src: '/images/cam8.jpg', title: 'Благоустройство территорий', tag: 'Благоустройство' },
  { src: '/images/cam9.jpg', title: 'Инфраструктура и парковки', tag: 'Инфраструктура' },
];

export const GALLERY_FEATURED = {
  src: '/images/kindergarten.jpg',
  title: 'Восстановление здания яслей-сада № 16',
  tag: 'Реставрация',
  description: 'Восстановление и реконструкция здания дошкольного учреждения.',
};

export const GALLERY_ALL = [...GALLERY, GALLERY_FEATURED];
