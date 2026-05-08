import {
  TruckIcon, TicketIcon, BriefcaseIcon, CameraIcon, ShoppingBagIcon,
  StarIcon, TagIcon, CakeIcon, HomeModernIcon, FilmIcon, TrophyIcon
} from '@heroicons/react/24/outline';

// Mapea los nombres de icono guardados en DB (NewCategoryModal usa valores como
// 'utensils', 'building', 'truck', 'coffee', etc. — NO son nombres de Material
// Icons) a componentes de Heroicons. Antes ProviderCard intentaba renderizarlos
// como `<span class="material-icons-outlined">{name}</span>` y la fuente mostraba
// el texto literal porque 'utensils' no existe en Material Icons.
const CATEGORY_ICON_MAP = {
  utensils: CakeIcon,
  restaurant: CakeIcon,
  coffee: CakeIcon,
  building: HomeModernIcon,
  hotel: HomeModernIcon,
  truck: TruckIcon,
  directions_bus: TruckIcon,
  ticket: TicketIcon,
  briefcase: BriefcaseIcon,
  camera: CameraIcon,
  'shopping-bag': ShoppingBagIcon,
  shopping_bag: ShoppingBagIcon,
  star: StarIcon,
  theater_comedy: FilmIcon,
  sports: TrophyIcon,
  tag: TagIcon
};

export const getCategoryIconComponent = (iconName) => {
  if (!iconName) return TagIcon;
  return CATEGORY_ICON_MAP[iconName] || TagIcon;
};
