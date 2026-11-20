import { siDiscord, siFacebook, siGithub, siInstagram } from 'simple-icons';

// Contact channels. Patterns mirror the DB check constraints in supabase/migrations.
export const CONTACTS = [
  {
    key: 'facebook_url',
    label: 'Facebook',
    icon: siFacebook.path,
    url: true,
    pattern: 'https://(www\\.|m\\.)?(facebook|fb)\\.com/.+',
    placeholder: 'https://facebook.com/ชื่อผู้ใช้',
  },
  {
    key: 'instagram_url',
    label: 'Instagram',
    icon: siInstagram.path,
    url: true,
    pattern: 'https://(www\\.)?instagram\\.com/.+',
    placeholder: 'https://instagram.com/ชื่อผู้ใช้',
  },
  {
    key: 'discord_username',
    label: 'Discord',
    icon: siDiscord.path,
    url: false,
    pattern: '[a-z0-9_.]{2,32}',
    placeholder: 'username',
  },
  {
    key: 'github_url',
    label: 'GitHub',
    icon: siGithub.path,
    url: true,
    pattern: 'https://(www\\.)?github\\.com/.+',
    placeholder: 'https://github.com/ชื่อผู้ใช้',
  },
] as const;

export type ContactKey = (typeof CONTACTS)[number]['key'];
export type Contacts = Record<ContactKey, string | null>;
export const CONTACT_COLUMNS = CONTACTS.map((c) => c.key).join(', ');
