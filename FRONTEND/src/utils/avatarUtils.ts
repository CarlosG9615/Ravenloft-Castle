const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const isDataUrl = (value: string) => /^data:/i.test(value);
const isAppPath = (value: string) => value.startsWith('/');
const hasExtension = (value: string) => /\.[a-z0-9]+$/i.test(value);

export const resolveProfileAvatar = (avatar?: string): string | undefined => {
  if (!avatar) return undefined;
  if (isAbsoluteUrl(avatar) || isDataUrl(avatar) || isAppPath(avatar)) return avatar;
  const normalized = hasExtension(avatar) ? avatar : `${avatar}.png`;
  return `/images/avatars/${normalized}`;
};

