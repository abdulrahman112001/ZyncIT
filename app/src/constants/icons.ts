/**
 * Icon System for ZyncIT App
 * Centralized icon names using Ionicons
 * @see https://ionic.io/ionicons
 */

// Navigation icons
export const NAV_ICONS = {
  home: 'home',
  homeOutline: 'home-outline',
  settings: 'settings',
  settingsOutline: 'settings-outline',
  menu: 'menu',
  back: 'chevron-back',
  forward: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',
  close: 'close',
  closeCircle: 'close-circle',
} as const;

// Action icons
export const ACTION_ICONS = {
  add: 'add',
  addCircle: 'add-circle',
  remove: 'remove',
  removeCircle: 'remove-circle',
  edit: 'create',
  editOutline: 'create-outline',
  delete: 'trash',
  deleteOutline: 'trash-outline',
  save: 'save',
  saveOutline: 'save-outline',
  share: 'share',
  shareOutline: 'share-outline',
  copy: 'copy',
  copyOutline: 'copy-outline',
  refresh: 'refresh',
  reload: 'reload',
  search: 'search',
  searchOutline: 'search-outline',
  filter: 'filter',
  sort: 'swap-vertical',
  more: 'ellipsis-vertical',
  moreHorizontal: 'ellipsis-horizontal',
  send: 'send',
  sendOutline: 'send-outline',
  download: 'download',
  upload: 'cloud-upload',
  sync: 'sync',
  syncCircle: 'sync-circle',
} as const;

// Status icons
export const STATUS_ICONS = {
  success: 'checkmark-circle',
  successOutline: 'checkmark-circle-outline',
  error: 'alert-circle',
  errorOutline: 'alert-circle-outline',
  warning: 'warning',
  warningOutline: 'warning-outline',
  info: 'information-circle',
  infoOutline: 'information-circle-outline',
  checkmark: 'checkmark',
  checkmarkDone: 'checkmark-done',
  help: 'help-circle',
  helpOutline: 'help-circle-outline',
} as const;

// Communication icons
export const COMMUNICATION_ICONS = {
  call: 'call',
  callOutline: 'call-outline',
  phone: 'phone-portrait',
  phoneOutline: 'phone-portrait-outline',
  message: 'chatbubble',
  messageOutline: 'chatbubble-outline',
  messages: 'chatbubbles',
  messagesOutline: 'chatbubbles-outline',
  mail: 'mail',
  mailOutline: 'mail-outline',
  notifications: 'notifications',
  notificationsOutline: 'notifications-outline',
  notificationsOff: 'notifications-off',
  notificationsOffOutline: 'notifications-off-outline',
} as const;

// User icons
export const USER_ICONS = {
  person: 'person',
  personOutline: 'person-outline',
  personCircle: 'person-circle',
  personCircleOutline: 'person-circle-outline',
  people: 'people',
  peopleOutline: 'people-outline',
  contacts: 'people',
  personAdd: 'person-add',
  personAddOutline: 'person-add-outline',
} as const;

// Media icons
export const MEDIA_ICONS = {
  image: 'image',
  imageOutline: 'image-outline',
  images: 'images',
  imagesOutline: 'images-outline',
  camera: 'camera',
  cameraOutline: 'camera-outline',
  mic: 'mic',
  micOutline: 'mic-outline',
  micOff: 'mic-off',
  micOffOutline: 'mic-off-outline',
  volume: 'volume-high',
  volumeOutline: 'volume-high-outline',
  volumeMute: 'volume-mute',
  play: 'play',
  playCircle: 'play-circle',
  pause: 'pause',
  pauseCircle: 'pause-circle',
  stop: 'stop',
  stopCircle: 'stop-circle',
} as const;

// File & storage icons
export const FILE_ICONS = {
  document: 'document',
  documentOutline: 'document-outline',
  documents: 'documents',
  documentsOutline: 'documents-outline',
  folder: 'folder',
  folderOutline: 'folder-outline',
  folderOpen: 'folder-open',
  folderOpenOutline: 'folder-open-outline',
  attach: 'attach',
  attachOutline: 'attach-outline',
  cloud: 'cloud',
  cloudOutline: 'cloud-outline',
} as const;

// Security icons
export const SECURITY_ICONS = {
  lock: 'lock-closed',
  lockOutline: 'lock-closed-outline',
  unlock: 'lock-open',
  unlockOutline: 'lock-open-outline',
  shield: 'shield',
  shieldOutline: 'shield-outline',
  shieldCheckmark: 'shield-checkmark',
  shieldCheckmarkOutline: 'shield-checkmark-outline',
  eye: 'eye',
  eyeOutline: 'eye-outline',
  eyeOff: 'eye-off',
  eyeOffOutline: 'eye-off-outline',
  key: 'key',
  keyOutline: 'key-outline',
  fingerPrint: 'finger-print',
  fingerPrintOutline: 'finger-print-outline',
} as const;

// Time icons
export const TIME_ICONS = {
  time: 'time',
  timeOutline: 'time-outline',
  calendar: 'calendar',
  calendarOutline: 'calendar-outline',
  alarm: 'alarm',
  alarmOutline: 'alarm-outline',
  timer: 'timer',
  timerOutline: 'timer-outline',
  hourglass: 'hourglass',
  hourglassOutline: 'hourglass-outline',
} as const;

// Theme icons
export const THEME_ICONS = {
  sunny: 'sunny',
  sunnyOutline: 'sunny-outline',
  moon: 'moon',
  moonOutline: 'moon-outline',
  contrast: 'contrast',
  contrastOutline: 'contrast-outline',
  colorPalette: 'color-palette',
  colorPaletteOutline: 'color-palette-outline',
} as const;

// Misc icons
export const MISC_ICONS = {
  globe: 'globe',
  globeOutline: 'globe-outline',
  language: 'language',
  heart: 'heart',
  heartOutline: 'heart-outline',
  star: 'star',
  starOutline: 'star-outline',
  starHalf: 'star-half',
  link: 'link',
  linkOutline: 'link-outline',
  qrCode: 'qr-code',
  qrCodeOutline: 'qr-code-outline',
  barcode: 'barcode',
  barcodeOutline: 'barcode-outline',
  wifi: 'wifi',
  wifiOutline: 'wifi-outline',
  bluetooth: 'bluetooth',
  bluetoothOutline: 'bluetooth-outline',
  location: 'location',
  locationOutline: 'location-outline',
  map: 'map',
  mapOutline: 'map-outline',
  flash: 'flash',
  flashOutline: 'flash-outline',
  flashOff: 'flash-off',
  flashOffOutline: 'flash-off-outline',
  power: 'power',
  powerOutline: 'power-outline',
  exit: 'exit',
  exitOutline: 'exit-outline',
  enter: 'enter',
  enterOutline: 'enter-outline',
  log: 'reader',
  logOutline: 'reader-outline',
  code: 'code-slash',
  codeOutline: 'code-slash-outline',
  bug: 'bug',
  bugOutline: 'bug-outline',
} as const;

// Call status icons
export const CALL_STATUS_ICONS = {
  incoming: 'call',
  outgoing: 'call',
  missed: 'call',
  incomingArrow: 'arrow-down-circle',
  outgoingArrow: 'arrow-up-circle',
} as const;

// All icons combined
export const ICONS = {
  ...NAV_ICONS,
  ...ACTION_ICONS,
  ...STATUS_ICONS,
  ...COMMUNICATION_ICONS,
  ...USER_ICONS,
  ...MEDIA_ICONS,
  ...FILE_ICONS,
  ...SECURITY_ICONS,
  ...TIME_ICONS,
  ...THEME_ICONS,
  ...MISC_ICONS,
  ...CALL_STATUS_ICONS,
} as const;

// Icon sizes (consistent with spacing system)
export const ICON_SIZES = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

// Type definitions
export type IconName = (typeof ICONS)[keyof typeof ICONS];
export type IconSize = keyof typeof ICON_SIZES;

// Default export
export default ICONS;
